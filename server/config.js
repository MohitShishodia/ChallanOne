// Email configuration for Brevo
export const emailConfig = {
  apiKey: process.env.BREVO_API_KEY,
  fromEmail: 'mohitsisodia667@gmail.com',
  fromName: 'Challan One'
};

// MSG91 OTP Widget configuration for registration SMS
export const msg91WidgetConfig = {
  authKey: process.env.MSG91_AUTH_KEY,
  widgetId: process.env.MSG91_WIDGET_ID,
  widgetToken: process.env.MSG91_WIDGET_TOKEN,
  countryCode: process.env.MSG91_COUNTRY_CODE || '91',
  expiryMinutes: Number(process.env.MSG91_OTP_EXPIRY_MINUTES) || 15
};

// JWT configuration (customer-facing)
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'challan-one-jwt-secret-key-2024',
  expiresIn: '7d'
};

// Admin JWT configuration (stricter)
export const adminJwtConfig = {
  secret: process.env.ADMIN_JWT_SECRET || 'challanone-admin-secret-2024',
  accessExpiresIn: '2h',
  refreshExpiresIn: '7d'
};

// OTP configuration
export const otpConfig = {
  length: 6,
  expiryMinutes: 5
};

// Admin panel configuration
export const adminConfig = {
  defaultPageSize: 20,
  maxPageSize: 100,
  bcryptSaltRounds: 12
};
