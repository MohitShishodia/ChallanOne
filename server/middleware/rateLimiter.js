// Rate limiting middleware for admin routes
import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for login endpoints
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for sensitive operations (password reset, etc.)
 * 3 attempts per 30 minutes
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default { loginLimiter, apiLimiter, sensitiveLimiter };
