// Admin JWT authentication middleware
import jwt from 'jsonwebtoken';
import { getAdminById } from '../data/admins.js';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'challanone-admin-secret-2024';

/**
 * Middleware to verify admin JWT tokens.
 * Attaches the admin user to req.admin on success.
 */
export function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

      // Attach decoded admin info to request
      req.admin = {
        id: decoded.adminId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
}

/**
 * Generate admin access token (short-lived)
 */
export function generateAdminAccessToken(admin) {
  return jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: admin.role_name || admin.role,
      permissions: admin.permissions || []
    },
    ADMIN_JWT_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Generate admin refresh token (long-lived)
 */
export function generateAdminRefreshToken(admin) {
  return jwt.sign(
    { adminId: admin.id, type: 'refresh' },
    ADMIN_JWT_SECRET + '-refresh',
    { expiresIn: '7d' }
  );
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET + '-refresh');
  } catch {
    return null;
  }
}

export default adminAuth;
