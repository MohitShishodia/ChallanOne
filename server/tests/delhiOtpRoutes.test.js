import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import delhiOtpRoutes from '../routes/delhiOtpChallan.js';

// Keep real fetch for hitting the local test server; mock global.fetch only for external API calls.
const httpFetch = global.fetch;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/delhi-otp', delhiOtpRoutes);
  return app;
}

async function request(app, method, path, body) {
  const server = app.listen(0);
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}${path}`;

  try {
    const res = await httpFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json();
    return { status: res.status, body: json };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const originalFetch = global.fetch;

describe('Delhi OTP Routes', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('POST /runs returns 400 when vehicle or mobile missing', async () => {
    const app = createTestApp();
    const res = await request(app, 'POST', '/api/delhi-otp/runs', { vehicleNumber: 'DL05CX4567' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('POST /runs returns 400 for invalid chassis length', async () => {
    const app = createTestApp();
    const res = await request(app, 'POST', '/api/delhi-otp/runs', {
      vehicleNumber: 'DL05CX4567',
      mobileNumber: '9876543210',
      chassisNumber: '123'
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /chassis/i);
  });

  it('POST /runs returns 400 for invalid mobile', async () => {
    const app = createTestApp();
    const res = await request(app, 'POST', '/api/delhi-otp/runs', {
      vehicleNumber: 'DL05CX4567',
      mobileNumber: '12345'
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /mobile/i);
  });

  it('POST /runs creates run on success', async () => {
    global.fetch = async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.rc_number, 'DL05CX4567');
      assert.equal(body.otpSource.code, 'DELHI_OTP');
      assert.equal(body.chassisLast4, '3456');
      assert.equal(body.engineLast4, '7890');
      assert.equal(body.vehicleNumber, undefined);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            runId: 'run-test-123',
            status: 'AWAITING_OTP',
            interactiveChallenge: { nextAction: 'SUBMIT_FETCH_OTP', availableActions: ['SUBMIT_FETCH_OTP'] }
          },
          message: 'Run created'
        })
      };
    };

    const app = createTestApp();
    const res = await request(app, 'POST', '/api/delhi-otp/runs', {
      vehicleNumber: 'DL05CX4567',
      mobileNumber: '9876543210',
      chassisNumber: '3456',
      engineNumber: '7890'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.runId, 'run-test-123');
    assert.equal(res.body.nextAction, 'SUBMIT_FETCH_OTP');
  });

  it('POST /runs/:runId/actions returns 400 for invalid action', async () => {
    const app = createTestApp();
    const res = await request(app, 'POST', '/api/delhi-otp/runs/run-1/actions', {
      action: 'INVALID_ACTION'
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid action/i);
  });

  it('POST /runs/:runId/actions returns 400 when OTP too short', async () => {
    const app = createTestApp();
    const res = await request(app, 'POST', '/api/delhi-otp/runs/run-1/actions', {
      action: 'SUBMIT_FETCH_OTP',
      payload: { otp: '12' }
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /OTP/i);
  });

  it('POST /runs/:runId/actions accepts SUBMIT_FETCH_OTP', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          runId: 'run-1',
          status: 'COMPLETED',
          data: { interactiveChallenge: { nextAction: null, availableActions: [] } }
        }
      })
    });

    const app = createTestApp();
    const res = await request(app, 'POST', '/api/delhi-otp/runs/run-1/actions', {
      action: 'SUBMIT_FETCH_OTP',
      payload: { otp: '605279' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('GET /runs/:runId returns completed challans filtered', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          status: 'COMPLETED',
          vehicleNumber: 'DL05CX4567',
          challans: [
            {
              challanNumber: 'DL-1',
              amount: 500,
              paymentStatus: 'UNPAID',
              sentToVirtualCourt: false,
              courtChallan: false,
              challanType: 'ONLINE'
            },
            {
              challanNumber: 'DL-2',
              amount: 1000,
              paymentStatus: 'UNPAID',
              sentToVirtualCourt: true,
              courtChallan: false,
              challanType: 'ONLINE'
            }
          ]
        }
      })
    });

    const app = createTestApp();
    const res = await request(app, 'GET', '/api/delhi-otp/runs/run-1');

    assert.equal(res.status, 200);
    assert.equal(res.body.isTerminal, true);
    assert.equal(res.body.challans.length, 1);
    assert.equal(res.body.challans[0].id, 'DL-1');
  });
});
