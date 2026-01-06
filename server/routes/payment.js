import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { storePayment, getPaymentById, getPaymentsByEmail } from '../data/payments.js';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, vehicleNumber, challans, userEmail } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Generate unique receipt ID
    const receiptId = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        vehicleNumber: vehicleNumber || '',
        challanIds: challans?.map(c => c.id).join(',') || '',
        userEmail: userEmail || ''
      }
    };
    
    const order = await razorpay.orders.create(options);
    
    return res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Verify payment and store receipt
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      vehicleNumber,
      challans,
      subtotal,
      convenienceFee,
      totalAmount,
      userEmail
    } = req.body;
    
    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');
    
    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
    
    // Generate receipt ID
    const receiptId = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Store payment
    const receipt = storePayment({
      receiptId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail,
      vehicleNumber,
      challans,
      subtotal,
      convenienceFee,
      totalAmount
    });
    
    return res.json({
      success: true,
      message: 'Payment verified successfully',
      receipt
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Get receipt by ID
router.get('/receipt/:id', (req, res) => {
  try {
    const receipt = getPaymentById(req.params.id);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }
    
    return res.json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get receipt'
    });
  }
});

// Get all receipts for user
router.get('/user-receipts', (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const receipts = getPaymentsByEmail(email);
    
    return res.json({
      success: true,
      receipts
    });
  } catch (error) {
    console.error('Get user receipts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get receipts'
    });
  }
});

export default router;
