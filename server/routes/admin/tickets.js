// Admin support ticket management routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { getTickets, getTicketById, assignTicket, respondToTicket, updateTicketStatus, updateTicketPriority } from '../../data/supportTickets.js';
import { logActivity } from '../../data/activityLog.js';

const router = express.Router();

// GET /api/admin/tickets
router.get('/', adminAuth, requirePermission(PERMISSIONS.VIEW_TICKETS), async (req, res) => {
  try {
    const result = await getTickets(req.query);
    return res.json(result);
  } catch (error) {
    console.error('Get tickets error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/tickets/:id
router.get('/:id', adminAuth, requirePermission(PERMISSIONS.VIEW_TICKETS), async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    return res.json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/tickets/:id/assign
router.patch('/:id/assign', adminAuth, requirePermission(PERMISSIONS.MANAGE_TICKETS), async (req, res) => {
  try {
    const { admin_id } = req.body;
    if (!admin_id) {
      return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    const result = await assignTicket(req.params.id, admin_id);

    if (result.success) {
      await logActivity(req.admin.id, 'ticket_assigned', 'ticket', req.params.id, { assignedTo: admin_id });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/tickets/:id/respond
router.post('/:id/respond', adminAuth, requirePermission(PERMISSIONS.MANAGE_TICKETS), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const result = await respondToTicket(req.params.id, req.admin.id, message);

    if (result.success) {
      await logActivity(req.admin.id, 'ticket_response', 'ticket', req.params.id);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/tickets/:id/status
router.patch('/:id/status', adminAuth, requirePermission(PERMISSIONS.MANAGE_TICKETS), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await updateTicketStatus(req.params.id, status);

    if (result.success) {
      await logActivity(req.admin.id, 'ticket_status_update', 'ticket', req.params.id, { newStatus: status });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/tickets/:id/priority
router.patch('/:id/priority', adminAuth, requirePermission(PERMISSIONS.MANAGE_TICKETS), async (req, res) => {
  try {
    const { priority } = req.body;
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }

    const result = await updateTicketPriority(req.params.id, priority);

    if (result.success) {
      await logActivity(req.admin.id, 'ticket_priority_update', 'ticket', req.params.id, { newPriority: priority });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
