import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import PaymentModel from '../models/Payment.js';
import ReceiptModel from '../models/Receipt.js';
import { emitPaymentEvent } from '../utils/searchLogger.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const razorpayConfigured =
  Boolean(razorpayKeyId && razorpayKeySecret) &&
  !/replace|placeholder/i.test(`${razorpayKeyId} ${razorpayKeySecret}`) &&
  (!isProduction || razorpayKeyId.startsWith('rzp_live_'));
const razorpay = razorpayConfigured
  ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
  : null;
const PREMIUM_REPORT_PRICE_PAISE = 500;

function requireRazorpay(req, res, next) {
  if (!razorpayConfigured) {
    const message = isProduction
      ? 'Live Razorpay credentials are not configured'
      : 'Razorpay credentials are not configured';
    return res.status(503).json({ success: false, message });
  }
  next();
}

function verifyWebhookSignature(rawBody, signature) {
  if (!Buffer.isBuffer(rawBody) || typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', razorpayWebhookSecret)
    .update(rawBody)
    .digest();
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expectedSignature);
}

async function saveRazorpayPayment(paymentId, fields, { preserveSuccess = false } = {}) {
  const filter = { razorpay_payment_id: paymentId };
  if (preserveSuccess) filter.status = { $ne: 'SUCCESS' };

  try {
    return await PaymentModel.findOneAndUpdate(
      filter,
      { $set: fields, $setOnInsert: { razorpay_payment_id: paymentId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;

    const storedPayment = await PaymentModel.findOne({ razorpay_payment_id: paymentId });
    if (!storedPayment) throw error;
    if (preserveSuccess && storedPayment.status === 'SUCCESS') return storedPayment;

    const updatedPayment = await PaymentModel.findOneAndUpdate(
      { razorpay_payment_id: paymentId },
      { $set: fields },
      { new: true, runValidators: true }
    );
    if (!updatedPayment) throw error;
    return updatedPayment;
  }
}

router.post('/webhook', (req, res, next) => {
  if (!razorpayWebhookSecret) {
    return res.status(503).json({ success: false, message: 'Razorpay webhook secret is not configured' });
  }
  next();
}, requireRazorpay, async (req, res) => {
  const signature = req.get('x-razorpay-signature');
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  let webhookEvent;
  try {
    webhookEvent = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
  }

  if (!['payment.captured', 'payment.failed'].includes(webhookEvent.event)) {
    return res.json({ success: true, message: 'Webhook event ignored' });
  }

  const paymentStatus = webhookEvent.event === 'payment.captured' ? 'SUCCESS' : 'FAILED';
  const payment = webhookEvent.payload?.payment?.entity;
  if (
    typeof payment?.id !== 'string' || !payment.id ||
    typeof payment?.order_id !== 'string' || !payment.order_id ||
    !Number.isSafeInteger(payment.amount) || payment.amount < 100
  ) {
    return res.status(400).json({ success: false, message: 'Invalid payment webhook payload' });
  }

  try {
    const order = await razorpay.orders.fetch(payment.order_id);
    const notes = order.notes || {};
    const totalAmount = payment.amount / 100;
    const paidAt = payment.created_at
      ? new Date(payment.created_at * 1000)
      : new Date();

    await saveRazorpayPayment(payment.id, {
      vehicle_number: notes.vehicleNumber || undefined,
      user_email: notes.userEmail || undefined,
      payment_type: notes.product === 'premium_report' ? 'PREMIUM_REPORT' : 'CHALLAN',
      total_amount: totalAmount,
      subtotal: totalAmount,
      convenience_fee: 0,
      payment_method: payment.method || 'Razorpay',
      razorpay_order_id: payment.order_id,
      status: paymentStatus,
      paid_at: paidAt
    }, { preserveSuccess: paymentStatus === 'FAILED' });

    console.log(`✅ Razorpay ${webhookEvent.event} webhook processed for payment ${payment.id}`);
    return res.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process payment webhook' });
  }
});

// Create Razorpay order
router.post('/create-order', requireRazorpay, async (req, res) => {
  try {
    const { amount, vehicleNumber, challans, userEmail } = req.body || {};
    const amountInPaise = Number.isFinite(amount) ? Math.round(amount * 100) : 0;

    if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ success: false, message: 'Amount must be at least 100 paise' });
    }

    const receiptId = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        vehicleNumber: vehicleNumber || '',
        userEmail: userEmail || ''
      }
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    const isAuthenticationError = error?.statusCode === 401 || error?.error?.statusCode === 401;
    return res
      .status(isAuthenticationError ? 401 : 500)
      .json({
        success: false,
        message: isAuthenticationError ? 'Razorpay authentication failed' : 'Failed to create order'
      });
  }
});

router.post('/premium-report/create-order', requireRazorpay, async (req, res) => {
  try {
    const receiptId = `PRM-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const order = await razorpay.orders.create({
      amount: PREMIUM_REPORT_PRICE_PAISE,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        product: 'premium_report',
        userEmail: String(req.body?.userEmail || '').trim().slice(0, 254)
      }
    });

    return res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt },
      key: razorpayKeyId
    });
  } catch (error) {
    console.error('Create premium report order error:', error);
    const isAuthenticationError = error?.statusCode === 401 || error?.error?.statusCode === 401;
    return res.status(isAuthenticationError ? 401 : 500).json({
      success: false,
      message: isAuthenticationError ? 'Razorpay authentication failed' : 'Failed to create order'
    });
  }
});

router.post('/premium-report/verify', requireRazorpay, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (
      typeof razorpay_order_id !== 'string' || !razorpay_order_id.trim() ||
      typeof razorpay_payment_id !== 'string' || !razorpay_payment_id.trim() ||
      typeof razorpay_signature !== 'string' || !/^[a-f\d]{64}$/i.test(razorpay_signature)
    ) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    if (!crypto.timingSafeEqual(Buffer.from(razorpay_signature, 'hex'), expectedSignature)) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    if (
      order.id !== razorpay_order_id ||
      order.amount !== PREMIUM_REPORT_PRICE_PAISE ||
      order.amount_paid !== PREMIUM_REPORT_PRICE_PAISE ||
      order.status !== 'paid' ||
      order.currency !== 'INR' ||
      order.notes?.product !== 'premium_report'
    ) {
      return res.status(400).json({ success: false, message: 'Invalid premium report order' });
    }

    await saveRazorpayPayment(razorpay_payment_id, {
      user_email: order.notes.userEmail || undefined,
      payment_type: 'PREMIUM_REPORT',
      subtotal: PREMIUM_REPORT_PRICE_PAISE / 100,
      convenience_fee: 0,
      total_amount: PREMIUM_REPORT_PRICE_PAISE / 100,
      payment_method: 'Razorpay',
      razorpay_order_id,
      razorpay_signature,
      status: 'SUCCESS',
      paid_at: new Date()
    });

    return res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Premium report payment verification error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// Verify payment and store receipt
router.post('/verify', requireRazorpay, async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      vehicleNumber, challans, subtotal, convenienceFee, totalAmount, userEmail
    } = req.body || {};

    if (
      typeof razorpay_order_id !== 'string' || !razorpay_order_id.trim() ||
      typeof razorpay_payment_id !== 'string' || !razorpay_payment_id.trim() ||
      typeof razorpay_signature !== 'string' || !razorpay_signature.trim()
    ) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }
    if (!Array.isArray(challans)) {
      return res.status(400).json({ success: false, message: 'Invalid challans' });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', razorpayKeySecret).update(sign).digest();
    const suppliedSign = /^[a-f\d]{64}$/i.test(razorpay_signature)
      ? Buffer.from(razorpay_signature, 'hex')
      : null;

    if (!suppliedSign || !crypto.timingSafeEqual(suppliedSign, expectedSign)) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    console.log('💳 Payment signature verified; saving payment to MongoDB...');

    const receiptNumber = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const challanDbIds = challans
      .map(challan => challan?.dbId)
      .filter(id => mongoose.isValidObjectId(id));

    const payment = await saveRazorpayPayment(razorpay_payment_id, {
      vehicle_number: vehicleNumber,
      user_email: userEmail,
      challan_ids: challanDbIds,
      subtotal,
      convenience_fee: convenienceFee,
      total_amount: totalAmount,
      payment_method: 'Razorpay',
      razorpay_order_id,
      razorpay_signature,
      status: 'SUCCESS',
      paid_at: new Date()
    });

    // Store receipt in MongoDB
    try {
      await ReceiptModel.create({
        payment_id: payment._id,
        receipt_number: receiptNumber,
        vehicle_number: vehicleNumber,
        user_email: userEmail,
        challan_details: challans,
        amount_paid: totalAmount,
        payment_date: new Date(),
        email_sent: false,
        sms_sent: false
      });
    } catch (receiptError) {
      console.error('Receipt insert error:', receiptError);
    }

    console.log('✅ Payment stored successfully in MongoDB');

    emitPaymentEvent(req, {
      vehicleNumber,
      amount: totalAmount,
      challansCount: challans.length,
      paymentId: razorpay_payment_id
    });

    const receipt = {
      id: receiptNumber,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userEmail,
      vehicleNumber,
      challans,
      subtotal,
      convenienceFee,
      totalAmount,
      status: 'SUCCESS',
      paidAt: new Date().toISOString()
    };

    return res.json({ success: true, message: 'Payment verified successfully', receipt });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// Get receipt by ID
router.get('/receipt/:id', async (req, res) => {
  try {
    const receipt = await ReceiptModel.findOne({ receipt_number: req.params.id });

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    return res.json({
      success: true,
      receipt: {
        id: receipt.receipt_number,
        vehicleNumber: receipt.vehicle_number,
        challans: receipt.challan_details,
        totalAmount: receipt.amount_paid,
        status: 'SUCCESS',
        userEmail: receipt.user_email,
        paidAt: receipt.payment_date
      }
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get receipt' });
  }
});

// Get all receipts for user
router.get('/user-receipts', userAuth, async (req, res) => {
  try {
    const normalizedEmail = String(req.user.email).trim().toLowerCase();
    const receipts = await ReceiptModel.find({ user_email: normalizedEmail }).sort({ payment_date: -1 });

    const formattedReceipts = receipts.map(r => ({
      id: r.receipt_number,
      vehicleNumber: r.vehicle_number,
      challans: r.challan_details,
      totalAmount: r.amount_paid,
      status: 'SUCCESS',
      userEmail: r.user_email,
      paidAt: r.payment_date
    }));

    return res.json({ success: true, receipts: formattedReceipts });
  } catch (error) {
    console.error('Get user receipts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get receipts' });
  }
});

export default router;
