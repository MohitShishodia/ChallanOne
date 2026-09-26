// Rate limiting middleware for admin routes
import rateLimit from 'express-rate-limit';
import { logChallanSearch } from '../utils/searchLogger.js';

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

/**
 * Create a handler for rate limited requests to log them
 */
function createRateLimitedHandler(searchType) {
  return async (req, res, next, options) => {
    // Log the rate limited event
    await logChallanSearch(req, {
      vehicleNumber: req.params?.vehicleNumber || req.body?.vehicleNumber || 'UNKNOWN',
      searchType,
      status: 'rate_limited',
      responseTimeMs: 0,
      errorMessage: options.message?.message || 'Rate limit exceeded',
      metadata: { rateLimited: true, retryAfter: options.message?.retryAfter }
    }).catch(() => {});
    
    // Send the default response
    res.status(429).json(options.message);
  };
}

/**
 * Rate limiter for RC Details endpoint
 * 10 requests per day per user (or IP if not authenticated)
 */
export const rcDetailsLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: {
    success: false,
    message: 'Daily RC Details limit exceeded (10 calls/day). Please try again tomorrow.',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  },
  skip: (req) => {
    // Skip for admin users
    return req.admin === true;
  },
  handler: createRateLimitedHandler('RC_DETAILS')
});

/**
 * Rate limiter for Challan API calls
 * 50 requests per day per user (or IP if not authenticated)
 */
export const challanApiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50,
  message: {
    success: false,
    message: 'Daily Challan API limit exceeded (50 calls/day). Please try again tomorrow.',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  },
  skip: (req) => {
    return req.admin === true;
  },
  handler: createRateLimitedHandler('ALL_CHALLANS')
});

export default { loginLimiter, apiLimiter, sensitiveLimiter, rcDetailsLimiter, challanApiLimiter };
