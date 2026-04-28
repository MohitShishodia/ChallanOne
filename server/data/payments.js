// In-memory storage for payment receipts (legacy - now MongoDB-backed)
import PaymentModel from '../models/Payment.js';

export function storePayment(paymentData) {
  // Legacy in-memory method kept for compatibility - main storage is MongoDB via payment route
  const receipt = {
    id: paymentData.receiptId,
    razorpayOrderId: paymentData.razorpay_order_id,
    razorpayPaymentId: paymentData.razorpay_payment_id,
    razorpaySignature: paymentData.razorpay_signature,
    userEmail: paymentData.userEmail,
    vehicleNumber: paymentData.vehicleNumber,
    challans: paymentData.challans,
    subtotal: paymentData.subtotal,
    convenienceFee: paymentData.convenienceFee,
    totalAmount: paymentData.totalAmount,
    status: 'PAID',
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  return receipt;
}

export async function getPaymentById(receiptId) {
  try {
    return await PaymentModel.findById(receiptId);
  } catch {
    return null;
  }
}

export async function getPaymentsByEmail(email) {
  try {
    return await PaymentModel.find({ user_email: email }).sort({ paid_at: -1 });
  } catch {
    return [];
  }
}

export async function getPaymentByRazorpayId(razorpayPaymentId) {
  try {
    return await PaymentModel.findOne({ razorpay_payment_id: razorpayPaymentId });
  } catch {
    return null;
  }
}
