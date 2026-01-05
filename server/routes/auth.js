import express from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig, otpConfig } from '../config.js';
import { generateOtp, storeOtp, verifyOtp } from '../utils/otpStore.js';
import { sendEmailOtp } from '../utils/sendOtp.js';
import { createUser, verifyUserCredentials, updateUserLogin, getUser, userExists } from '../data/users.js';

const router = express.Router();

// Temporary storage for pending registrations (email -> {password, name, phone})
const pendingRegistrations = new Map();

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { email, password, isLogin } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // For login - verify credentials first
    if (isLogin) {
      const verification = await verifyUserCredentials(email, password);
      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message
        });
      }
    } else {
      // For signup - check if user already exists
      if (await userExists(email)) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please login instead.'
        });
      }
    }
    
    // Generate OTP
    const otp = generateOtp(otpConfig.length);
    
    // Store OTP
    storeOtp(email, otp, otpConfig.expiryMinutes);
    
    // Store password temporarily for signup verification
    if (!isLogin) {
      pendingRegistrations.set(email, { password });
    }
    
    // Send OTP via email
    const result = await sendEmailOtp(email, otp);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
    
    return res.json({
      success: true,
      message: `OTP sent successfully to ${email}`,
      expiresIn: otpConfig.expiryMinutes * 60 // in seconds
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Direct login endpoint (no OTP required)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // Verify credentials
    const verification = await verifyUserCredentials(email, password);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }
    
    // Update last login
    updateUserLogin(email);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: verification.user.id, email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: verification.user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, password, name, phone, isSignup } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }
    
    // Verify OTP
    const verification = verifyOtp(email, otp);
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }
    
    let user;
    
    if (isSignup) {
      // Get the pending registration
      const pending = pendingRegistrations.get(email);
      if (!pending) {
        return res.status(400).json({
          success: false,
          message: 'Registration session expired. Please start again.'
        });
      }
      
      // Create new user
      const createResult = await createUser(email, pending.password, name, phone);
      if (!createResult.success) {
        return res.status(400).json({
          success: false,
          message: createResult.message
        });
      }
      
      user = createResult.user;
      
      // Clean up pending registration
      pendingRegistrations.delete(email);
    } else {
      // Login - verify credentials again
      const credVerification = await verifyUserCredentials(email, password);
      if (!credVerification.success) {
        return res.status(400).json({
          success: false,
          message: credVerification.message
        });
      }
      user = credVerification.user;
    }
    
    // Update last login
    updateUserLogin(email);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    
    return res.json({
      success: true,
      message: isSignup ? 'Account created successfully!' : 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user endpoint (protected)
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = getUser(decoded.email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.json({
        success: true,
        user
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password - send OTP to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if user exists
    if (!await userExists(email)) {
      return res.status(400).json({
        success: false,
        message: 'No account found with this email address.'
      });
    }
    
    // Generate OTP
    const otp = generateOtp(otpConfig.length);
    
    // Store OTP
    storeOtp(email, otp, otpConfig.expiryMinutes);
    
    // Send OTP via email
    const result = await sendEmailOtp(email, otp);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
    
    return res.json({
      success: true,
      message: `Password reset OTP sent to ${email}`,
      expiresIn: otpConfig.expiryMinutes * 60
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password - verify OTP and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Verify OTP
    const verification = verifyOtp(email, otp);
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }
    
    // Update password (need to import updatePassword)
    const { updatePassword } = await import('../data/users.js');
    const updateResult = updatePassword(email, newPassword);
    
    if (!updateResult.success) {
      return res.status(400).json({
        success: false,
        message: updateResult.message
      });
    }
    
    return res.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
