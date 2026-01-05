// User management with Supabase
import supabase from '../config/supabase.js';
import crypto from 'crypto';

// Password hashing using crypto (more secure than base64)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

// Create user (for signup)
export async function createUser(email, password, name = null, phone = null) {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: hashPassword(password),
        name: name || null,
        phone: phone || null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Failed to create user' };
    }

    return { 
      success: true, 
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        createdAt: newUser.created_at
      }
    };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, message: 'Database error' };
  }
}

// Verify user credentials (for login)
export async function verifyUserCredentials(email, password) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { success: false, message: 'User not found. Please sign up first.' };
    }

    if (!verifyPassword(password, user.password_hash)) {
      return { success: false, message: 'Invalid password' };
    }

    return { 
      success: true, 
      user: {
        id: user.id,
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

// Get user by email
export async function getUser(email) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, phone, created_at, last_login')
      .eq('email', email)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
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

// Check if user exists
export async function userExists(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    return !!data && !error;
  } catch (error) {
    return false;
  }
}

// Update user last login
export async function updateUserLogin(email) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('email', email);

    return !error;
  } catch (error) {
    console.error('Update login error:', error);
    return false;
  }
}

// Update user password (for forgot password feature)
export async function updatePassword(email, newPassword) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashPassword(newPassword) })
      .eq('email', email);

    if (error) {
      console.error('Update password error:', error);
      return { success: false, message: 'Failed to update password' };
    }

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, message: 'Database error' };
  }
}

// Get all users (for debugging)
export async function getAllUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, phone, created_at, last_login');

    if (error) {
      return [];
    }

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
}
