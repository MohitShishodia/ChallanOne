// User management with MongoDB/Mongoose
import crypto from 'crypto';
import UserModel from '../models/User.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

export async function createUser(email, password, name = null, phone = null) {
  try {
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) return { success: false, message: 'User already exists' };

    const newUser = await UserModel.create({
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      name: name || null,
      phone: phone || null
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
    return { success: false, message: 'Failed to create user' };
  }
}

export async function verifyUserCredentials(email, password) {
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
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

export async function getUser(email) {
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('-password_hash');
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

export async function userExists(email) {
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('_id');
    return !!user;
  } catch (error) {
    return false;
  }
}

export async function updateUserLogin(email) {
  try {
    await UserModel.updateOne({ email: email.toLowerCase() }, { last_login: new Date() });
    return true;
  } catch (error) {
    console.error('Update login error:', error);
    return false;
  }
}

export async function updatePassword(email, newPassword) {
  try {
    await UserModel.updateOne(
      { email: email.toLowerCase() },
      { password_hash: hashPassword(newPassword) }
    );
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, message: 'Database error' };
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
