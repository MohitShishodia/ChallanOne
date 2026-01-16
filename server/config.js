// Resend configuration (recommended for cloud platforms)
export const resendConfig = {
  apiKey: process.env.RESEND_API_KEY || 're_ZfjGraxw_CfkkesGkTA8suwNa16kopGX6',
  from: 'Challan One <onboarding@resend.dev>' // Use your verified domain in production
};

// Email configuration for Nodemailer (fallback)
export const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'mohitsisodia667@gmail.com',
    pass: process.env.SMTP_PASS || 'xnyb ytpc lonk lawf'
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
