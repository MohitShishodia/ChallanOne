import 'dotenv/config';
import { connectDB } from './config/mongodb.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Customer-facing routes
import authRoutes from './routes/auth.js';
import challanRoutes from './routes/challan.js';
import vehicleRoutes from './routes/vehicle.js';
import paymentRoutes from './routes/payment.js';
import externalApiRoutes from './routes/externalApi.js';

// Admin routes
import adminAuthRoutes from './routes/admin/auth.js';
import adminDashboardRoutes from './routes/admin/dashboard.js';
import adminUserRoutes from './routes/admin/users.js';
import adminChallanRoutes from './routes/admin/challans.js';
import adminPaymentRoutes from './routes/admin/payments.js';
import adminServiceRoutes from './routes/admin/services.js';
import adminRoleRoutes from './routes/admin/roles.js';
import adminReportRoutes from './routes/admin/reports.js';
import adminSettingsRoutes from './routes/admin/settings.js';
import adminNotificationRoutes from './routes/admin/notifications.js';
import adminCmsRoutes from './routes/admin/cms.js';
import adminTicketRoutes from './routes/admin/tickets.js';

// Middleware
import { apiLimiter } from './middleware/rateLimiter.js';

import { verifyEmailConnection } from './utils/sendOtp.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO for real-time updates
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible in routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log(`👑 Admin joined: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://challan-6em3pm74m-mohits-projects-af211191.vercel.app',
  'https://challanone.vercel.app',
  /\.vercel\.app$/   // allow all vercel preview deployments
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (isAllowed) return callback(null, true);
    // still allow unknown origins in development
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Explicitly handle preflight for all routes
app.options('*', cors());

app.use(express.json());

// Customer-facing routes
app.use('/api/auth', authRoutes);
app.use('/api/challan', challanRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/external', externalApiRoutes);

// Admin routes (with rate limiting)
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', apiLimiter, adminDashboardRoutes);
app.use('/api/admin/users', apiLimiter, adminUserRoutes);
app.use('/api/admin/challans', apiLimiter, adminChallanRoutes);
app.use('/api/admin/payments', apiLimiter, adminPaymentRoutes);
app.use('/api/admin/services', apiLimiter, adminServiceRoutes);
app.use('/api/admin/roles', apiLimiter, adminRoleRoutes);
app.use('/api/admin/reports', apiLimiter, adminReportRoutes);
app.use('/api/admin/settings', apiLimiter, adminSettingsRoutes);
app.use('/api/admin/notifications', apiLimiter, adminNotificationRoutes);
app.use('/api/admin/cms', apiLimiter, adminCmsRoutes);
app.use('/api/admin/tickets', apiLimiter, adminTicketRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// DB diagnostic endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    const mongoose = (await import('./config/mongodb.js')).default;
    const state = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const mongoUri = process.env.MONGODB_URI;
    res.json({
      status: stateMap[state] || 'unknown',
      readyState: state,
      hasMongoUri: !!mongoUri,
      uriPreview: mongoUri ? mongoUri.replace(/:([^@]+)@/, ':****@') : 'NOT SET',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`👑 Admin API ready at http://localhost:${PORT}/api/admin`);

  // Connect to MongoDB
  await connectDB();

  // Verify email connection
  const emailReady = await verifyEmailConnection();
  if (emailReady) {
    console.log('📧 Email service is ready');
  } else {
    console.log('⚠️ Email service is not configured properly');
  }
});
