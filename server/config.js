// Email configuration for Resend
export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY || 're_8rqMiqqa_8R3jeteMf2BDTdGGqSWM5Lp2',
  fromEmail: 'Challan One <onboarding@resend.dev>'
};

// Fast2SMS configuration for SMS OTP
export const smsConfig = {
  apiKey: 'U159aajln4HoRwDFudNkZKD029uQnwCO6SpAGbfH5oQFG9hEA2lj8xxNWF54',
  senderId: 'CHALAN',
  route: 'otp'
};

// JWT configuration
export const jwtConfig = {
  secret: 'challan-one-jwt-secret-key-2024',
  expiresIn: '7d'
};

// OTP configuration
export const otpConfig = {
  length: 6,
  expiryMinutes: 5
};
