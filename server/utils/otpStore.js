// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Generate a random 6-digit OTP
export function generateOtp(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

// Store OTP with expiry
export function storeOtp(identifier, otp, expiryMinutes = 5) {
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
  otpStore.set(identifier, { otp, expiresAt });
  
  // Auto-cleanup after expiry
  setTimeout(() => {
    otpStore.delete(identifier);
  }, expiryMinutes * 60 * 1000);
  
  return true;
}

// Verify OTP
export function verifyOtp(identifier, otp) {
  const stored = otpStore.get(identifier);
  
  if (!stored) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // OTP is valid, remove it
  otpStore.delete(identifier);
  return { valid: true, message: 'OTP verified successfully' };
}

// Clear OTP manually
export function clearOtp(identifier) {
  otpStore.delete(identifier);
}
