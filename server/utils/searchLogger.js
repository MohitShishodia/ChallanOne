import ChallanSearchModel from '../models/ChallanSearch.js';

/**
 * Log a challan search and emit real-time event to admin.
 */
export async function logChallanSearch(req, { vehicleNumber, searchType, status, challansFound, responseTimeMs, errorMessage, metadata }) {
  try {
    const doc = await ChallanSearchModel.create({
      vehicle_number: vehicleNumber,
      search_type: searchType,
      user_id: req.user?.id || null,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      user_agent: req.headers['user-agent'] || null,
      status: status || 'success',
      challans_found: challansFound || 0,
      response_time_ms: responseTimeMs || 0,
      error_message: errorMessage || null,
      metadata: metadata || null
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('challan-search', {
        id: doc._id.toString(),
        vehicleNumber,
        searchType,
        status: status || 'success',
        challansFound: challansFound || 0,
        createdAt: doc.created_at
      });
    }

    return doc;
  } catch (error) {
    console.error('[SearchLogger] Failed to log search:', error.message);
    return null;
  }
}

/**
 * Emit a real-time event to admin panel for payments.
 */
export function emitPaymentEvent(req, { vehicleNumber, amount, challansCount, paymentId }) {
  try {
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('payment-received', {
        vehicleNumber,
        amount,
        challansCount,
        paymentId,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[SearchLogger] Failed to emit payment event:', error.message);
  }
}
