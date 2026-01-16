// Email configuration for Nodemailer (Gmail)
export const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'mohitsisodia667@gmail.com',
    pass: process.env.SMTP_PASS || 'xnybytpclonklawf'
  }
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
