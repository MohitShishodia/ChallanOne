import express from 'express';
import { createTicket } from '../data/supportTickets.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

function emitSupportMessage(req, ticket) {
  const io = req.app.get('io');
  if (!io) return;
  io.to('admin-room').emit('new-support-message', {
    id: ticket._id?.toString(),
    subject: ticket.subject,
    guestName: ticket.guest_name,
    guestEmail: ticket.guest_email,
    status: ticket.status,
    createdAt: ticket.created_at
  });
}

/**
 * POST /api/support/contact
 * Public endpoint for website contact / support forms.
 */
router.post('/contact', apiLimiter, async (req, res) => {
  try {
    const { name, email, message, source } = req.body;

    if (!name?.trim() || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    if (!message?.trim() || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();
    const from = source || 'website';

    const result = await createTicket({
      subject: `Message from ${trimmedName}`,
      description: trimmedMessage,
      guest_name: trimmedName,
      guest_email: trimmedEmail,
      source: from,
      priority: 'medium'
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.message || 'Failed to send message' });
    }

    emitSupportMessage(req, result.ticket);

    return res.status(201).json({
      success: true,
      message: 'Your message has been received. Our team will contact you soon.',
      ticketId: result.ticket._id.toString()
    });
  } catch (error) {
    console.error('Support contact error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
