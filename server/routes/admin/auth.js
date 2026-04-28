// Admin authentication routes
import express from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { adminAuth, generateAdminAccessToken, generateAdminRefreshToken, verifyRefreshToken } from '../../middleware/adminAuth.js';
import { loginLimiter } from '../../middleware/rateLimiter.js';
import { verifyAdminCredentials, getAdminById, storeRefreshToken, revokeRefreshToken, isRefreshTokenValid } from '../../data/admins.js';
import { logActivity } from '../../data/activityLog.js';

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// POST /api/admin/login
router.post('/login', loginLimiter, validate({ body: loginSchema }), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await verifyAdminCredentials(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }

    const admin = result.admin;

    // Generate tokens
    const accessToken = generateAdminAccessToken(admin);
    const refreshToken = generateAdminRefreshToken(admin);

    // Store refresh token
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    await storeRefreshToken(admin.id, refreshToken, expires.toISOString());

    // Log activity
    await logActivity(admin.id, 'admin_login', 'admin', admin.id, { email }, req.ip);

    return res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role_name,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if token is still valid in DB
    const isValid = await isRefreshTokenValid(refreshToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked'
      });
    }

    // Get admin details
    const admin = await getAdminById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Generate new access token
    const accessToken = generateAdminAccessToken(admin);

    return res.json({
      success: true,
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role_name,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/logout
router.post('/logout', adminAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    await logActivity(req.admin.id, 'admin_logout', 'admin', req.admin.id);

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/me
router.get('/me', adminAuth, async (req, res) => {
  try {
    const admin = await getAdminById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role_name,
        roleId: admin.role_id,
        permissions: admin.permissions,
        status: admin.status,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/profile - alias for /me with richer info
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const admin = await getAdminById(req.admin.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    return res.json({
      success: true,
      profile: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role_name,
        roleId: admin.role_id,
        permissions: admin.permissions,
        status: admin.status,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin,
        totalPermissions: admin.permissions?.length || 0
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
