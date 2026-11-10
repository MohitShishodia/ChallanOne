// User management with MongoDB/Mongoose
import crypto from 'crypto';
import UserModel from '../models/User.js';
import { resolveLoginIdentifier } from '../utils/loginIdentifier.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

export async function createUser(email, password, name = null, phone = null) {
  try {
    const phoneDigits = String(phone || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      return { success: false, message: 'Enter a valid 10-digit mobile number.' };
    }

    const existingPhone = await UserModel.findOne({
      phone: { $in: [phoneDigits, `91${phoneDigits}`, `+91${phoneDigits}`] }
    }).select('_id');
    if (existingPhone) {
      return { success: false, message: 'This mobile number is already linked to an account. Use a different number.' };
    }

    const newUser = await UserModel.create({
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      name: name || null,
      phone: phoneDigits
    });

    return {
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        createdAt: newUser.created_at
      }
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      message: error?.code === 11000
        ? 'This mobile number is already linked to an account. Use a different number.'
        : 'Failed to create user'
    };
  }
}

export async function verifyUserCredentials(identifier, password) {
  try {
    const resolvedIdentifier = resolveLoginIdentifier(identifier);
    if (!resolvedIdentifier) {
      return { success: false, message: 'Enter a valid email address or 10-digit mobile number.' };
    }

    const users = await UserModel.find(resolvedIdentifier.query).limit(2);
    if (users.length > 1) {
      return {
        success: false,
        message: resolvedIdentifier.type === 'email'
          ? 'This email is shared by multiple accounts. Sign in with your mobile number.'
          : 'This mobile number is linked to multiple accounts. Contact support to recover access.'
      };
    }
    const [user] = users;
    if (!user) return { success: false, message: 'User not found. Please sign up first.' };
    if (!verifyPassword(password, user.password_hash)) return { success: false, message: 'Invalid password' };

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        createdAt: user.created_at
      }
    };
  } catch (error) {
    console.error('Verify credentials error:', error);
    return { success: false, message: 'Database error' };
  }
}

export async function getUser(userId) {
  try {
    const user = await UserModel.findById(userId).select('-password_hash');
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function findUserByPhone(phone) {
  try {
    const digits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
    const normalizedPhone = digits.startsWith('0091') ? digits.slice(4)
      : digits.startsWith('91') && digits.length === 12 ? digits.slice(2)
        : digits;
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return {
        success: false,
        code: 'INVALID_PHONE',
        message: 'Enter a valid 10-digit Indian mobile number.'
      };
    }

    const users = await UserModel.find({
      phone: { $in: [normalizedPhone, `91${normalizedPhone}`, `+91${normalizedPhone}`] }
    }).limit(2);
    if (users.length > 1) {
      return {
        success: false,
        code: 'AMBIGUOUS_PHONE',
        message: 'This mobile number is linked to multiple accounts. Contact support.'
      };
    }
    if (!users.length) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: 'No account found with this mobile number.'
      };
    }

    const [user] = users;
    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        createdAt: user.created_at
      }
    };
  } catch (error) {
    console.error('Find user by phone error:', error);
    return { success: false, code: 'DATABASE_ERROR', message: 'Database error' };
  }
}

export async function phoneExists(phone) {
  const result = await findUserByPhone(phone);
  if (result.success) return { success: true, exists: true };
  if (result.code === 'NOT_FOUND') return { success: true, exists: false };
  return { success: false, message: result.message };
}

export async function updateUserLogin(userId) {
  try {
    const result = await UserModel.updateOne({ _id: userId }, { last_login: new Date() });
    return result.matchedCount > 0;
  } catch (error) {
    console.error('Update login error:', error);
    return false;
  }
}

export async function updatePassword(userId, newPassword) {
  try {
    const result = await UserModel.updateOne(
      { _id: userId },
      { password_hash: hashPassword(newPassword) }
    );
    if (result.matchedCount === 0) return { success: false, message: 'Account not found' };
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, message: 'Database error' };
  }
}

export async function updateUserProfile(userId, { name, email: newEmail }) {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const updates = {};
    if (name !== undefined && name.trim().length >= 2) {
      updates.name = name.trim();
    }
    const normalizedEmail = typeof newEmail === 'string' ? newEmail.trim().toLowerCase() : '';
    if (normalizedEmail && normalizedEmail !== user.email.toLowerCase()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, message: 'Enter a valid email address' };
      }
      updates.email = normalizedEmail;
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, message: 'No valid fields to update' };
    }

    await UserModel.updateOne({ _id: userId }, updates);

    const updated = await UserModel.findById(userId).select('-password_hash');

    return {
      success: true,
      user: {
        id: updated._id.toString(),
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        createdAt: updated.created_at,
        lastLogin: updated.last_login
      }
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, message: 'Failed to update profile' };
  }
}

export async function getAllUsers() {
  try {
    const users = await UserModel.find().select('-password_hash').sort({ created_at: -1 });
    return users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      phone: u.phone,
      createdAt: u.created_at,
      lastLogin: u.last_login
    }));
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
}
