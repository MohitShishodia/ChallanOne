import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';

process.env.RAZORPAY_KEY_ID = 'rzp_test_payment_routes';
process.env.RAZORPAY_KEY_SECRET = 'payment-route-test-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'payment-webhook-test-secret';

Razorpay.prototype.addResources = function addMockResources() {
  this.orders = {
    fetch: async (orderId) => ({
      id: orderId,
      notes: { vehicleNumber: 'DL01AB1234', userEmail: 'payer@example.com' }
    })
  };
};

const { default: paymentRoutes } = await import('../routes/payment.js');
const { default: PaymentModel } = await import('../models/Payment.js');
const { default: ReceiptModel } = await import('../models/Receipt.js');

function createTestApp() {
  const app = express();
  app.use('/api/payment/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json());
  app.use('/api/payment', paymentRoutes);
  return app;
}

async function request(method, path, body, headers = {}) {
  const server = createTestApp().listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: Buffer.isBuffer(body) ? body : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

describe('Razorpay payment routes', () => {
  it('rejects order amounts below the 100-paise minimum', async () => {
    const response = await request('POST', '/api/payment/create-order', { amount: 0.99 });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  it('rejects non-numeric order amounts', async () => {
    const response = await request('POST', '/api/payment/create-order', { amount: '100' });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  it('rejects payment verification when required signature fields are missing', async () => {
    const response = await request('POST', '/api/payment/verify', {});

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  it('rejects payment verification when the signature does not match', async () => {
    const response = await request('POST', '/api/payment/verify', {
      razorpay_order_id: 'order_test',
      razorpay_payment_id: 'payment_test',
      razorpay_signature: '0'.repeat(64),
      challans: []
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  it('does not report success when the payment record cannot be saved', async () => {
    const originalFindOneAndUpdate = PaymentModel.findOneAndUpdate;
    PaymentModel.findOneAndUpdate = async () => {
      throw new Error('Database unavailable');
    };

    const razorpay_order_id = 'order_test';
    const razorpay_payment_id = 'payment_test';
    const razorpay_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    try {
      const response = await request('POST', '/api/payment/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        challans: []
      });

      assert.equal(response.status, 500);
      assert.equal(response.body.success, false);
    } finally {
      PaymentModel.findOneAndUpdate = originalFindOneAndUpdate;
    }
  });

  it('saves successful payments when challans include external non-ObjectId IDs', async () => {
    const originalFindOneAndUpdate = PaymentModel.findOneAndUpdate;
    const originalReceiptCreate = ReceiptModel.create;
    let savedUpdate;
    let savedPaymentFilter;
    PaymentModel.findOneAndUpdate = async (filter, update) => {
      savedPaymentFilter = filter;
      savedUpdate = update;
      return { _id: '507f1f77bcf86cd799439011' };
    };
    ReceiptModel.create = async () => ({});

    const razorpay_order_id = 'order_test';
    const razorpay_payment_id = 'payment_test';
    const razorpay_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    try {
      const response = await request('POST', '/api/payment/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        challans: [
          { dbId: 'DL3035522508202142558' },
          { dbId: '507f1f77bcf86cd799439012' }
        ]
      });

      assert.equal(response.status, 200);
      assert.equal(response.body.success, true);
      assert.equal(savedPaymentFilter.razorpay_payment_id, razorpay_payment_id);
      assert.deepEqual(savedUpdate.$set.challan_ids, ['507f1f77bcf86cd799439012']);
    } finally {
      PaymentModel.findOneAndUpdate = originalFindOneAndUpdate;
      ReceiptModel.create = originalReceiptCreate;
    }
  });

  it('rejects webhooks with invalid signatures', async () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    const response = await request(
      'POST',
      '/api/payment/webhook',
      rawBody,
      { 'x-razorpay-signature': '0'.repeat(64) }
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  it('records a captured payment from a valid raw-body-signed webhook', async () => {
    const originalFindOneAndUpdate = PaymentModel.findOneAndUpdate;
    let savedPaymentFilter;
    let savedPaymentUpdate;
    PaymentModel.findOneAndUpdate = async (filter, update) => {
      savedPaymentFilter = filter;
      savedPaymentUpdate = update;
      return {};
    };

    const rawBody = Buffer.from(JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_test',
            order_id: 'order_webhook_test',
            amount: 2500,
            method: 'card',
            created_at: 1792600000
          }
        }
      }
    }));
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    try {
      const response = await request(
        'POST',
        '/api/payment/webhook',
        rawBody,
        { 'x-razorpay-signature': signature }
      );

      assert.equal(response.status, 200);
      assert.equal(response.body.success, true);
      assert.equal(savedPaymentFilter.razorpay_payment_id, 'pay_webhook_test');
      assert.equal(savedPaymentUpdate.$set.total_amount, 25);
      assert.equal(savedPaymentUpdate.$set.vehicle_number, 'DL01AB1234');
      assert.equal(savedPaymentUpdate.$set.status, 'SUCCESS');
    } finally {
      PaymentModel.findOneAndUpdate = originalFindOneAndUpdate;
    }
  });

  it('records failed payments from valid webhooks without downgrading existing successes', async () => {
    const originalFindOneAndUpdate = PaymentModel.findOneAndUpdate;
    let savedPaymentFilter;
    let savedPaymentUpdate;
    PaymentModel.findOneAndUpdate = async (filter, update) => {
      savedPaymentFilter = filter;
      savedPaymentUpdate = update;
      return {};
    };

    const rawBody = Buffer.from(JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_failed',
            order_id: 'order_webhook_failed',
            amount: 2500,
            method: 'card',
            created_at: 1792600000
          }
        }
      }
    }));
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    try {
      const response = await request(
        'POST',
        '/api/payment/webhook',
        rawBody,
        { 'x-razorpay-signature': signature }
      );

      assert.equal(response.status, 200);
      assert.equal(response.body.success, true);
      assert.deepEqual(savedPaymentFilter.status, { $ne: 'SUCCESS' });
      assert.equal(savedPaymentUpdate.$set.status, 'FAILED');
    } finally {
      PaymentModel.findOneAndUpdate = originalFindOneAndUpdate;
    }
  });

  it('does not overwrite a successful record when a failure webhook arrives later', async () => {
    const originalFindOneAndUpdate = PaymentModel.findOneAndUpdate;
    const originalFindOne = PaymentModel.findOne;
    let updateCalls = 0;
    PaymentModel.findOneAndUpdate = async () => {
      updateCalls += 1;
      const duplicateError = new Error('Duplicate payment ID');
      duplicateError.code = 11000;
      throw duplicateError;
    };
    PaymentModel.findOne = async () => ({ status: 'SUCCESS' });

    const rawBody = Buffer.from(JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_already_captured',
            order_id: 'order_already_captured',
            amount: 2500
          }
        }
      }
    }));
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    try {
      const response = await request(
        'POST',
        '/api/payment/webhook',
        rawBody,
        { 'x-razorpay-signature': signature }
      );

      assert.equal(response.status, 200);
      assert.equal(response.body.success, true);
      assert.equal(updateCalls, 1);
    } finally {
      PaymentModel.findOneAndUpdate = originalFindOneAndUpdate;
      PaymentModel.findOne = originalFindOne;
    }
  });
});
