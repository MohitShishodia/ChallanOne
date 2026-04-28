// Admin service management routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { getServices, getServiceById, createService, updateService, deleteService, toggleFeatured, toggleServiceStatus, getServiceCategories, createServiceCategory } from '../../data/services.js';
import { logActivity } from '../../data/activityLog.js';

const router = express.Router();

// GET /api/admin/services
router.get('/', adminAuth, requirePermission(PERMISSIONS.VIEW_SERVICES), async (req, res) => {
  try {
    const result = await getServices(req.query);
    return res.json(result);
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/services/categories
router.get('/categories', adminAuth, requirePermission(PERMISSIONS.VIEW_SERVICES), async (req, res) => {
  try {
    const categories = await getServiceCategories();
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/services/categories
router.post('/categories', adminAuth, requirePermission(PERMISSIONS.MANAGE_SERVICES), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await createServiceCategory(name, slug);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/services/:id
router.get('/:id', adminAuth, requirePermission(PERMISSIONS.VIEW_SERVICES), async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    return res.json({ success: true, service });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/services
router.post('/', adminAuth, requirePermission(PERMISSIONS.MANAGE_SERVICES), async (req, res) => {
  try {
    const { name, description, category_id, price, status, is_featured, icon } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const result = await createService({ name, description, category_id, price, status, is_featured, icon });

    if (result.success) {
      await logActivity(req.admin.id, 'service_created', 'service', result.service.id, { name });
    }

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/services/:id
router.put('/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_SERVICES), async (req, res) => {
  try {
    const result = await updateService(req.params.id, req.body);

    if (result.success) {
      await logActivity(req.admin.id, 'service_updated', 'service', req.params.id, { updates: req.body });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/services/:id
router.delete('/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_SERVICES), async (req, res) => {
  try {
    const result = await deleteService(req.params.id);

    if (result.success) {
      await logActivity(req.admin.id, 'service_deleted', 'service', req.params.id);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/services/:id/featured
router.patch('/:id/featured', adminAuth, requirePermission(PERMISSIONS.MANAGE_SERVICES), async (req, res) => {
  try {
    const result = await toggleFeatured(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/services/:id/status
router.patch('/:id/status', adminAuth, requirePermission(PERMISSIONS.MANAGE_SERVICES), async (req, res) => {
  try {
    const result = await toggleServiceStatus(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
