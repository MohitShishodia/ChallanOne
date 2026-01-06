// In-memory storage for payment receipts
// Will be replaced with Supabase integration later

const payments = new Map();

export function storePayment(paymentData) {
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
  
  payments.set(receipt.id, receipt);
  return receipt;
}

export function getPaymentById(receiptId) {
  return payments.get(receiptId) || null;
}

export function getPaymentsByEmail(email) {
  const userPayments = [];
  for (const payment of payments.values()) {
    if (payment.userEmail === email) {
      userPayments.push(payment);
    }
  }
  return userPayments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
}

export function getPaymentByRazorpayId(razorpayPaymentId) {
  for (const payment of payments.values()) {
    if (payment.razorpayPaymentId === razorpayPaymentId) {
      return payment;
    }
  }
  return null;
}
