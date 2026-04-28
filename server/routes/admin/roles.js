// Admin role & admin user management routes
import express from 'express';
import { z } from 'zod';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { getAllRoles, createRole, updateRole, deleteRole, getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../data/admins.js';
import { logActivity } from '../../data/activityLog.js';

const router = express.Router();

// ========================
// ROLE ROUTES
// ========================

// GET /api/admin/roles
router.get('/roles', adminAuth, requirePermission(PERMISSIONS.VIEW_ROLES), async (req, res) => {
  try {
    const roles = await getAllRoles();
    return res.json({ success: true, roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/roles
router.post('/roles', adminAuth, requirePermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Name and permissions array are required' });
    }

    const result = await createRole(name, permissions);

    if (result.success) {
      await logActivity(req.admin.id, 'role_created', 'role', result.role.id, { name, permissions });
    }

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/roles/:id
router.put('/roles/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const result = await updateRole(req.params.id, req.body);

    if (result.success) {
      await logActivity(req.admin.id, 'role_updated', 'role', req.params.id, req.body);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/roles/:id
router.delete('/roles/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const result = await deleteRole(req.params.id);

    if (result.success) {
      await logActivity(req.admin.id, 'role_deleted', 'role', req.params.id);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========================
// ADMIN USER ROUTES
// ========================

// GET /api/admin/roles/admins
router.get('/admins', adminAuth, requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => {
  try {
    const admins = await getAllAdmins();
    return res.json({ success: true, admins });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/roles/admins
const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role_id: z.string().min(1)  // MongoDB ObjectId (24-char hex), not UUID
});

router.post('/admins', adminAuth, requirePermission(PERMISSIONS.MANAGE_ADMINS), validate({ body: createAdminSchema }), async (req, res) => {
  try {
    const { email, password, name, role_id } = req.body;
    const result = await createAdmin(email, password, name, role_id);

    if (result.success) {
      await logActivity(req.admin.id, 'admin_created', 'admin', result.admin.id, { email, name });
    }

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/roles/admins/:id
router.put('/admins/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => {
  try {
    // Prevent self-demotion
    if (req.params.id === req.admin.id && req.body.role_id) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const result = await updateAdmin(req.params.id, req.body);

    if (result.success) {
      await logActivity(req.admin.id, 'admin_updated', 'admin', req.params.id, req.body);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/roles/admins/:id
router.delete('/admins/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.admin.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const result = await deleteAdmin(req.params.id);

    if (result.success) {
      await logActivity(req.admin.id, 'admin_deleted', 'admin', req.params.id);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/roles/permissions - List available permissions
router.get('/permissions', adminAuth, requirePermission(PERMISSIONS.VIEW_ROLES), (req, res) => {
  return res.json({
    success: true,
    permissions: Object.entries(PERMISSIONS).map(([key, value]) => ({
      key,
      value,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  });
});

export default router;
