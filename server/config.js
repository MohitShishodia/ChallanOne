// Email configuration for Brevo
export const emailConfig = {
  apiKey: process.env.BREVO_API_KEY,
  fromEmail: 'mohitsisodia667@gmail.com',
  fromName: 'Challan One'
};

// Fast2SMS configuration for SMS OTP
export const smsConfig = {
  apiKey: process.env.FAST2SMS_API_KEY || 'U159aajln4HoRwDFudNkZKD029uQnwCO6SpAGbfH5oQFG9hEA2lj8xxNWF54',
  senderId: 'CHALAN',
  route: 'otp'
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'challan-one-jwt-secret-key-2024',
  expiresIn: '7d'
};

// OTP configuration
export const otpConfig = {
  length: 6,
  expiryMinutes: 5
};
