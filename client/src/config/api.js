// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// API Endpoints
export const API = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    sendOtp: `${API_BASE_URL}/api/auth/send-otp`,
    verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  },
  challan: (vehicleNumber) => `${API_BASE_URL}/api/challan/${encodeURIComponent(vehicleNumber)}`,
  vehicle: (vehicleNumber) => `${API_BASE_URL}/api/vehicle/${encodeURIComponent(vehicleNumber)}`,
  payment: {
    createOrder: `${API_BASE_URL}/api/payment/create-order`,
    verify: `${API_BASE_URL}/api/payment/verify`,
    receipt: (receiptId) => `${API_BASE_URL}/api/payment/receipt/${receiptId}`,
  }
}
