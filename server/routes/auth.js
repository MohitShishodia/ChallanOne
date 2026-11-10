import express from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig, otpConfig, msg91WidgetConfig } from '../config.js';
import { generateOtp, storeOtp, verifyOtp } from '../utils/otpStore.js';
import {
  sendEmailOtp,
  sendMsg91WidgetOtp,
  verifyMsg91WidgetOtp,
  verifyMsg91WidgetAccessToken
} from '../utils/sendOtp.js';
import { msg91AccessTokenMatchesPhone } from '../utils/msg91Identity.js';
import {
  createUser,
  verifyUserCredentials,
  updateUserLogin,
  getUser,
  findUserByPhone,
  phoneExists,
  updateUserProfile,
  updatePassword
} from '../data/users.js';
import { userAuth } from '../middleware/userAuth.js';
import { smsOtpSendLimiter, smsOtpVerifyLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Pending registrations are discarded after the OTP expires.
const pendingRegistrations = new Map();
const passwordResetSessions = new Map();

function registrationKey(email, phone) {
  return `${email}:${phone}`;
}

router.get('/registration-widget-config', (req, res) => {
  if (!msg91WidgetConfig.widgetId || !msg91WidgetConfig.widgetToken) {
    return res.status(503).json({
      success: false,
      message: 'MSG91 OTP Widget is not configured on the server.'
    });
  }

  return res.json({
    success: true,
    widgetId: msg91WidgetConfig.widgetId,
    tokenAuth: msg91WidgetConfig.widgetToken,
    expiresIn: msg91WidgetConfig.expiryMinutes * 60
  });
});

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { email, password, isLogin } = req.body;

    if (!isLogin) {
      return res.status(400).json({
        success: false,
        message: 'New accounts must be verified by SMS. Use /send-registration-otp.'
      });
    }

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

    const verification = await verifyUserCredentials(email, password);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
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

router.post('/send-registration-otp', smsOtpSendLimiter, async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.replace(/\D/g, '') : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (name.length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }
    const phoneCheck = await phoneExists(phone);
    if (!phoneCheck.success) {
      return res.status(500).json({ success: false, message: 'Unable to verify this mobile number.' });
    }
    if (phoneCheck.exists) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already linked to an account. Sign in with that number or use a different number.'
      });
    }

    const destination = `${msg91WidgetConfig.countryCode}${phone}`;
    const result = await sendMsg91WidgetOtp(destination);
    if (!result.success) {
      console.error('MSG91 widget registration OTP send failed:', result.error);
      const notConfigured = result.error?.includes('must be configured');
      return res.status(notConfigured ? 503 : 502).json({
        success: false,
        message: notConfigured
          ? 'SMS verification is not configured on the server.'
          : 'Unable to send the SMS OTP. Please try again.'
      });
    }

    const pending = {
      email,
      name,
      password,
      phone,
      requestId: result.requestId,
      expiresAt: Date.now() + msg91WidgetConfig.expiryMinutes * 60 * 1000,
      verifying: false
    };
    const key = registrationKey(email, phone);
    pendingRegistrations.set(key, pending);
    setTimeout(() => {
      if (pendingRegistrations.get(key) === pending) pendingRegistrations.delete(key);
    }, msg91WidgetConfig.expiryMinutes * 60 * 1000).unref?.();

    return res.json({
      success: true,
      message: `OTP sent to +${destination}.`,
      expiresIn: msg91WidgetConfig.expiryMinutes * 60
    });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    return res.status(500).json({ success: false, message: 'Unable to start registration.' });
  }
});

router.post('/verify-registration-otp', smsOtpVerifyLimiter, async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
    const accessToken = typeof req.body.accessToken === 'string' ? req.body.accessToken.trim() : '';

    if (accessToken) {
      const { name, password } = req.body;
      const phone = typeof req.body.phone === 'string' ? req.body.phone.replace(/\D/g, '') : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
      }
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
      }
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
      }
      const phoneCheck = await phoneExists(phone);
      if (!phoneCheck.success) {
        return res.status(500).json({ success: false, message: 'Unable to verify this mobile number.' });
      }
      if (phoneCheck.exists) {
        return res.status(409).json({
          success: false,
          message: 'This mobile number is already linked to an account. Use a different number.'
        });
      }

      const verification = await verifyMsg91WidgetAccessToken(accessToken);
      if (!verification.success) {
        console.error('MSG91 widget access-token verification failed:', verification.error);
        return res.status(400).json({ success: false, message: 'Mobile OTP verification failed. Please try again.' });
      }

      if (!msg91AccessTokenMatchesPhone(
        verification.data,
        phone,
        msg91WidgetConfig.countryCode
      )) {
        return res.status(400).json({
          success: false,
          message: 'The verified mobile number does not match your registration number.'
        });
      }

      const createResult = await createUser(email, password, name.trim(), phone);
      if (!createResult.success) {
        return res.status(400).json({ success: false, message: createResult.message });
      }

      const user = createResult.user;
      await updateUserLogin(user.id);
      const token = jwt.sign(
        { userId: user.id, email },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      return res.json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt
        }
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    const phone = typeof req.body.phone === 'string' ? req.body.phone.replace(/\D/g, '') : '';
    const key = registrationKey(email, phone);
    const pending = pendingRegistrations.get(key);
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter the 6-digit OTP.' });
    }
    if (!pending || pending.expiresAt <= Date.now()) {
      pendingRegistrations.delete(key);
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please request a new OTP.'
      });
    }
    if (pending.verifying) {
      return res.status(409).json({ success: false, message: 'OTP verification is already in progress.' });
    }

    pending.verifying = true;
    const verification = await verifyMsg91WidgetOtp(pending.requestId, otp);
    if (pendingRegistrations.get(key) !== pending) {
      return res.status(409).json({
        success: false,
        message: 'Registration session changed. Request a new OTP.'
      });
    }
    if (!verification.success) {
      pending.verifying = false;
      console.error('MSG91 widget registration OTP verification failed:', verification.error);
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    pendingRegistrations.delete(key);
    const phoneCheck = await phoneExists(pending.phone);
    if (!phoneCheck.success) {
      return res.status(500).json({ success: false, message: 'Unable to verify this mobile number.' });
    }
    if (phoneCheck.exists) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already linked to an account. Use a different number.'
      });
    }

    const createResult = await createUser(email, pending.password, pending.name, pending.phone);
    if (!createResult.success) {
      return res.status(400).json({ success: false, message: createResult.message });
    }

    const user = createResult.user;
    await updateUserLogin(user.id);
    const token = jwt.sign(
      { userId: user.id, email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return res.json({
      success: true,
      message: 'Account created successfully!',
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
    console.error('Verify registration OTP error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify registration.' });
  }
});

// Direct login endpoint (no OTP required)
router.post('/login', async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginIdentifier = identifier || email;

    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile number is required'
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
    const verification = await verifyUserCredentials(loginIdentifier, password);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Update last login
    const userEmail = verification.user.email;
    updateUserLogin(verification.user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: verification.user.id, email: userEmail },
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

// Keep the legacy endpoint from creating accounts without phone verification.
router.post('/signup', (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Direct sign-up is disabled. Verify your mobile number using /send-registration-otp first.'
  });
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, password, isSignup } = req.body;

    if (isSignup) {
      return res.status(400).json({
        success: false,
        message: 'New accounts must be verified by SMS. Use /verify-registration-otp.'
      });
    }

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

    const credVerification = await verifyUserCredentials(email, password);
    if (!credVerification.success) {
      return res.status(400).json({
        success: false,
        message: credVerification.message
      });
    }
    const user = credVerification.user;

    // Update last login
    updateUserLogin(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return res.json({
      success: true,
      message: 'Login successful',
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

// Update profile (name & email only — phone cannot be changed)
router.patch('/profile', userAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await updateUserProfile(req.user.userId, { name, email });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({ success: true, message: 'Profile updated', user: result.user });
  } catch (error) {
    console.error('Patch profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get current user endpoint (protected)
router.get('/me', async (req, res) => {
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
      const user = await getUser(decoded.userId);

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

// Forgot password - send an SMS OTP to the account's registered mobile number
router.post('/forgot-password', smsOtpSendLimiter, async (req, res) => {
  try {
    const phone = typeof req.body.phone === 'string' ? req.body.phone.replace(/\D/g, '') : '';
    const account = await findUserByPhone(phone);
    if (!account.success) {
      return res.status(400).json({ success: false, message: account.message });
    }

    const destination = `${msg91WidgetConfig.countryCode}${phone}`;
    const result = await sendMsg91WidgetOtp(destination);
    if (!result.success) {
      console.error('MSG91 password-reset OTP send failed:', result.error);
      return res.status(502).json({
        success: false,
        message: 'Unable to send the SMS OTP. Please try again.'
      });
    }

    const session = {
      userId: account.user.id,
      requestId: result.requestId,
      expiresAt: Date.now() + msg91WidgetConfig.expiryMinutes * 60 * 1000,
      verifying: false
    };
    passwordResetSessions.set(phone, session);
    setTimeout(() => {
      if (passwordResetSessions.get(phone) === session) passwordResetSessions.delete(phone);
    }, msg91WidgetConfig.expiryMinutes * 60 * 1000).unref?.();

    return res.json({
      success: true,
      message: `Password reset OTP sent to +${destination}`,
      expiresIn: msg91WidgetConfig.expiryMinutes * 60
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password - verify the SMS OTP and update the matched account
router.post('/reset-password', smsOtpVerifyLimiter, async (req, res) => {
  try {
    const phone = typeof req.body.phone === 'string' ? req.body.phone.replace(/\D/g, '') : '';
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter the 6-digit OTP.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const session = passwordResetSessions.get(phone);
    if (!session || session.expiresAt <= Date.now()) {
      passwordResetSessions.delete(phone);
      return res.status(400).json({ success: false, message: 'Reset session expired. Request a new OTP.' });
    }
    if (session.verifying) {
      return res.status(409).json({ success: false, message: 'OTP verification is already in progress.' });
    }

    session.verifying = true;
    const verification = await verifyMsg91WidgetOtp(session.requestId, otp);
    if (passwordResetSessions.get(phone) !== session) {
      return res.status(409).json({ success: false, message: 'Reset session changed. Request a new OTP.' });
    }
    if (!verification.success) {
      session.verifying = false;
      console.error('MSG91 password-reset OTP verification failed:', verification.error);
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const updateResult = await updatePassword(session.userId, newPassword);
    if (!updateResult.success) {
      return res.status(400).json({
        success: false,
        message: updateResult.message
      });
    }
    passwordResetSessions.delete(phone);

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
