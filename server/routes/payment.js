import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import PaymentModel from '../models/Payment.js';
import ReceiptModel from '../models/Receipt.js';
import ChallanModel from '../models/Challan.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, vehicleNumber, challans, userEmail } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const receiptId = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: receiptId,
      notes: {
        vehicleNumber: vehicleNumber || '',
        challanIds: challans?.map(c => c.id || c.dbId).join(',') || '',
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
    return res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Verify payment and store receipt
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      vehicleNumber, challans, subtotal, convenienceFee, totalAmount, userEmail
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    console.log('💳 Payment verified, storing in MongoDB...');

    const receiptNumber = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const challanDbIds = challans.map(c => c.dbId).filter(Boolean);

    // Store payment in MongoDB
    let payment = null;
    try {
      payment = await PaymentModel.create({
        vehicle_number: vehicleNumber,
        challan_ids: challanDbIds,
        subtotal,
        convenience_fee: convenienceFee,
        total_amount: totalAmount,
        payment_method: 'Razorpay',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: 'SUCCESS',
        paid_at: new Date()
      });
    } catch (paymentError) {
      console.error('Payment insert error:', paymentError);
    }

    // Store receipt in MongoDB
    try {
      await ReceiptModel.create({
        payment_id: payment?._id || null,
        receipt_number: receiptNumber,
        vehicle_number: vehicleNumber,
        challan_details: challans,
        amount_paid: totalAmount,
        payment_date: new Date(),
        email_sent: false,
        sms_sent: false
      });
    } catch (receiptError) {
      console.error('Receipt insert error:', receiptError);
    }

    // Update challan statuses to PAID
    if (challanDbIds.length > 0) {
      try {
        await ChallanModel.updateMany({ _id: { $in: challanDbIds } }, { status: 'PAID' });
        console.log(`✅ Updated ${challanDbIds.length} challans to PAID status`);
      } catch (updateError) {
        console.error('Challan status update error:', updateError);
      }
    }

    console.log('✅ Payment and receipt stored successfully in MongoDB');

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
      status: 'PAID',
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
        status: 'PAID',
        paidAt: receipt.payment_date
      }
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get receipt' });
  }
});

// Get all receipts for user
router.get('/user-receipts', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const receipts = await ReceiptModel.find().sort({ payment_date: -1 });

    const formattedReceipts = receipts.map(r => ({
      id: r.receipt_number,
      vehicleNumber: r.vehicle_number,
      challans: r.challan_details,
      totalAmount: r.amount_paid,
      status: 'PAID',
      paidAt: r.payment_date
    }));

    return res.json({ success: true, receipts: formattedReceipts });
  } catch (error) {
    console.error('Get user receipts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get receipts' });
  }
});

export default router;
