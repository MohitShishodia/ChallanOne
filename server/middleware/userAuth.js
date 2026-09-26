import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config.js';

export function userAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Extract user info from req.user if already populated by middleware,
 * or fall back to decoding the JWT from the Authorization header.
 * Returns { userId, email } or null.
 */
export function extractUserInfo(req) {
  if (req.user) {
    return { userId: req.user.userId || req.user.id, email: req.user.email };
  }

  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Optional authentication middleware.
 * Populates req.user if a valid JWT is present in the Authorization header,
 * but does NOT reject requests that lack authentication. This allows
 * logging middleware to capture user identity on public-facing endpoints
 * while still permitting anonymous access.
 */
export function optionalUserAuth(req, res, next) {
  const info = extractUserInfo(req);
  if (info) {
    req.user = info;
  }
  next();
}
