// Admin user management with MongoDB + bcrypt
import bcrypt from 'bcryptjs';
import AdminUserModel from '../models/AdminUser.js';
import RoleModel from '../models/Role.js';
import RefreshTokenModel from '../models/RefreshToken.js';

const SALT_ROUNDS = 12;

function formatAdmin(admin, role) {
  const r = role || admin.role_id;
  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    status: admin.status,
    role_name: r?.name || 'Unknown',
    role_id: r?._id?.toString() || admin.role_id?.toString(),
    permissions: r?.permissions || [],
    createdAt: admin.created_at,
    lastLogin: admin.last_login
  };
}

export async function createAdmin(email, password, name, roleId) {
  try {
    const existing = await AdminUserModel.findOne({ email: email.toLowerCase() });
    if (existing) return { success: false, message: 'Admin with this email already exists' };

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await AdminUserModel.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      role_id: roleId,
      status: 'active'
    });

    const role = await RoleModel.findById(roleId);
    return { success: true, admin: formatAdmin(admin, role) };
  } catch (error) {
    console.error('Create admin error:', error);
    return { success: false, message: 'Failed to create admin' };
  }
}

export async function verifyAdminCredentials(email, password) {
  try {
    const admin = await AdminUserModel.findOne({ email: email.toLowerCase() }).populate('role_id');
    if (!admin) return { success: false, message: 'Invalid email or password' };
    if (admin.status !== 'active') return { success: false, message: 'Your account has been deactivated. Contact super admin.' };

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return { success: false, message: 'Invalid email or password' };

    await AdminUserModel.updateOne({ _id: admin._id }, { last_login: new Date() });

    return { success: true, admin: formatAdmin(admin, admin.role_id) };
  } catch (error) {
    console.error('Verify admin credentials error:', error);
    return { success: false, message: 'Database error' };
  }
}

export async function getAdminById(id) {
  try {
    const admin = await AdminUserModel.findById(id).populate('role_id');
    if (!admin) return null;
    return formatAdmin(admin, admin.role_id);
  } catch (error) {
    console.error('Get admin error:', error);
    return null;
  }
}

export async function getAllAdmins() {
  try {
    const admins = await AdminUserModel.find().populate('role_id').sort({ created_at: -1 });
    return admins.map(a => formatAdmin(a, a.role_id));
  } catch (error) {
    console.error('Get all admins error:', error);
    return [];
  }
}

export async function updateAdmin(id, updates) {
  try {
    const updateData = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email.toLowerCase();
    if (updates.role_id) updateData.role_id = updates.role_id;
    if (updates.status) updateData.status = updates.status;
    if (updates.password) updateData.password_hash = await bcrypt.hash(updates.password, SALT_ROUNDS);

    const admin = await AdminUserModel.findByIdAndUpdate(id, updateData, { new: true }).populate('role_id');
    if (!admin) return { success: false, message: 'Admin not found' };
    return { success: true, admin: formatAdmin(admin, admin.role_id) };
  } catch (error) {
    console.error('Update admin error:', error);
    return { success: false, message: 'Failed to update admin' };
  }
}

export async function deleteAdmin(id) {
  try {
    await AdminUserModel.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    console.error('Delete admin error:', error);
    return { success: false, message: 'Failed to delete admin' };
  }
}

// --- Role operations ---

function formatRole(role) {
  return {
    id: role._id.toString(),
    _id: role._id.toString(),
    name: role.name,
    permissions: role.permissions,
    is_system: role.is_system,
    created_at: role.created_at
  };
}

export async function getAllRoles() {
  try {
    const roles = await RoleModel.find().sort({ created_at: 1 });
    return roles.map(formatRole);
  } catch (error) {
    console.error('Get roles error:', error);
    return [];
  }
}

export async function createRole(name, permissions) {
  try {
    const role = await RoleModel.create({ name, permissions, is_system: false });
    return { success: true, role: formatRole(role) };
  } catch (error) {
    console.error('Create role error:', error);
    return { success: false, message: 'Failed to create role' };
  }
}

export async function updateRole(id, updates) {
  try {
    if (!id || id === 'undefined') {
      return { success: false, message: 'Invalid role ID' };
    }
    // First check if role exists and whether it is a system role
    const existing = await RoleModel.findById(id);
    if (!existing) return { success: false, message: 'Role not found' };
    if (existing.is_system) return { success: false, message: 'System roles (Super Admin, Manager, Viewer) cannot be modified' };

    const role = await RoleModel.findByIdAndUpdate(
      id,
      { name: updates.name, permissions: updates.permissions },
      { new: true }
    );
    return { success: true, role: formatRole(role) };
  } catch (error) {
    console.error('Update role error:', error);
    return { success: false, message: 'Failed to update role' };
  }
}

export async function deleteRole(id) {
  try {
    const adminsWithRole = await AdminUserModel.countDocuments({ role_id: id });
    if (adminsWithRole > 0) return { success: false, message: 'Cannot delete role that is assigned to admin users' };

    const result = await RoleModel.findOneAndDelete({ _id: id, is_system: false });
    if (!result) return { success: false, message: 'Cannot delete system role' };
    return { success: true };
  } catch (error) {
    console.error('Delete role error:', error);
    return { success: false, message: 'Failed to delete role' };
  }
}

// --- Refresh Token operations ---

export async function storeRefreshToken(adminId, token, expiresAt) {
  try {
    await RefreshTokenModel.create({ admin_id: adminId, token, expires_at: new Date(expiresAt), is_revoked: false });
    return true;
  } catch (error) {
    console.error('Store refresh token error:', error);
    return false;
  }
}

export async function revokeRefreshToken(token) {
  try {
    await RefreshTokenModel.updateOne({ token }, { is_revoked: true });
    return true;
  } catch (error) {
    console.error('Revoke refresh token error:', error);
    return false;
  }
}

export async function isRefreshTokenValid(token) {
  try {
    const t = await RefreshTokenModel.findOne({ token, is_revoked: false });
    if (!t) return false;
    return new Date(t.expires_at) > new Date();
  } catch {
    return false;
  }
}
