// Support ticket management data layer - MongoDB
import SupportTicketModel from '../models/SupportTicket.js';

function formatTicket(ticket) {
  return {
    id: ticket._id.toString(),
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    user: ticket.user_id ? {
      id: ticket.user_id._id?.toString() || ticket.user_id.toString(),
      name: ticket.user_id.name,
      email: ticket.user_id.email
    } : null,
    assignedTo: ticket.assigned_to ? {
      id: ticket.assigned_to._id?.toString() || ticket.assigned_to.toString(),
      name: ticket.assigned_to.name,
      email: ticket.assigned_to.email
    } : null,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    resolvedAt: ticket.resolved_at
  };
}

export async function getTickets({ status, priority, assignedTo, search, page = 1, limit = 20 } = {}) {
  try {
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assigned_to = assignedTo;
    if (search) filter.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      SupportTicketModel.find(filter)
        .populate('user_id', 'id name email')
        .populate('assigned_to', 'id name email')
        .sort({ created_at: -1 }).skip(skip).limit(limit),
      SupportTicketModel.countDocuments(filter)
    ]);

    return {
      success: true,
      tickets: data.map(formatTicket),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get tickets error:', error);
    return { success: false, tickets: [], total: 0 };
  }
}

export async function getTicketById(id) {
  try {
    const ticket = await SupportTicketModel.findById(id)
      .populate('user_id', 'id name email')
      .populate('assigned_to', 'id name email')
      .populate('responses.admin_id', 'id name email');

    if (!ticket) return null;

    return {
      ...formatTicket(ticket),
      responses: (ticket.responses || []).map(r => ({
        id: r._id.toString(),
        message: r.message,
        admin: r.admin_id ? {
          id: r.admin_id._id?.toString(),
          name: r.admin_id.name,
          email: r.admin_id.email
        } : null,
        createdAt: r.created_at
      }))
    };
  } catch (error) {
    console.error('Get ticket error:', error);
    return null;
  }
}

export async function createTicket(ticketData) {
  try {
    const ticket = await SupportTicketModel.create({
      user_id: ticketData.user_id || null,
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      status: 'open'
    });
    return { success: true, ticket };
  } catch (error) {
    console.error('Create ticket error:', error);
    return { success: false, message: 'Failed to create ticket' };
  }
}

export async function assignTicket(ticketId, adminId) {
  try {
    const ticket = await SupportTicketModel.findByIdAndUpdate(
      ticketId,
      { assigned_to: adminId, status: 'in_progress', updated_at: new Date() },
      { new: true }
    );
    if (!ticket) return { success: false, message: 'Ticket not found' };
    return { success: true, ticket };
  } catch (error) {
    return { success: false, message: 'Database error' };
  }
}

export async function respondToTicket(ticketId, adminId, message) {
  try {
    const ticket = await SupportTicketModel.findByIdAndUpdate(
      ticketId,
      {
        $push: { responses: { message, admin_id: adminId, created_at: new Date() } },
        status: 'in_progress',
        updated_at: new Date()
      },
      { new: true }
    );
    if (!ticket) return { success: false, message: 'Ticket not found' };
    const response = ticket.responses[ticket.responses.length - 1];
    return { success: true, response };
  } catch (error) {
    console.error('Respond to ticket error:', error);
    return { success: false, message: 'Failed to send response' };
  }
}

export async function updateTicketStatus(ticketId, status) {
  try {
    const updateData = { status, updated_at: new Date() };
    if (status === 'resolved') updateData.resolved_at = new Date();

    const ticket = await SupportTicketModel.findByIdAndUpdate(ticketId, updateData, { new: true });
    if (!ticket) return { success: false, message: 'Ticket not found' };
    return { success: true, ticket };
  } catch (error) {
    return { success: false, message: 'Database error' };
  }
}

export async function updateTicketPriority(ticketId, priority) {
  try {
    const ticket = await SupportTicketModel.findByIdAndUpdate(
      ticketId,
      { priority, updated_at: new Date() },
      { new: true }
    );
    if (!ticket) return { success: false, message: 'Ticket not found' };
    return { success: true, ticket };
  } catch (error) {
    return { success: false, message: 'Database error' };
  }
}
