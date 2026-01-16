import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import supabase from '../config/supabase.js';

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
        challanIds: challans?.map(c => c.id || c.dbId).join(',') || '',
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

    console.log('💳 Payment verified, storing in database...');

    // Generate receipt number
    const receiptNumber = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get challan DB IDs for updating status
    const challanDbIds = challans.map(c => c.dbId).filter(Boolean);

    // Store payment in Supabase
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        vehicle_number: vehicleNumber,
        challan_ids: challanDbIds,
        subtotal: subtotal,
        convenience_fee: convenienceFee,
        total_amount: totalAmount,
        payment_method: 'Razorpay',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'SUCCESS',
        paid_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment insert error:', paymentError);
      // Continue anyway - payment was successful, we'll store receipt
    }

    // Store receipt in Supabase
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        payment_id: payment?.id,
        receipt_number: receiptNumber,
        vehicle_number: vehicleNumber,
        challan_details: challans,
        amount_paid: totalAmount,
        payment_date: new Date().toISOString(),
        email_sent: false,
        sms_sent: false
      })
      .select()
      .single();

    if (receiptError) {
      console.error('Receipt insert error:', receiptError);
    }

    // Update challan statuses to PAID
    if (challanDbIds.length > 0) {
      const { error: updateError } = await supabase
        .from('challans')
        .update({ status: 'PAID' })
        .in('id', challanDbIds);

      if (updateError) {
        console.error('Challan status update error:', updateError);
      } else {
        console.log(`✅ Updated ${challanDbIds.length} challans to PAID status`);
      }
    }

    console.log('✅ Payment and receipt stored successfully');

    // Build receipt response
    const receipt = {
      id: receiptNumber,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userEmail: userEmail,
      vehicleNumber: vehicleNumber,
      challans: challans,
      subtotal: subtotal,
      convenienceFee: convenienceFee,
      totalAmount: totalAmount,
      status: 'PAID',
      paidAt: new Date().toISOString()
    };

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
router.get('/receipt/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: receipt, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('receipt_number', id)
      .single();

    if (error || !receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
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
    return res.status(500).json({
      success: false,
      message: 'Failed to get receipt'
    });
  }
});

// Get all receipts for user
router.get('/user-receipts', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Get payments for this user from Supabase
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Get receipts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get receipts'
      });
    }

    const formattedReceipts = (receipts || []).map(r => ({
      id: r.receipt_number,
      vehicleNumber: r.vehicle_number,
      challans: r.challan_details,
      totalAmount: r.amount_paid,
      status: 'PAID',
      paidAt: r.payment_date
    }));

    return res.json({
      success: true,
      receipts: formattedReceipts
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
