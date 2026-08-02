import 'dotenv/config';
import { connectDB, isDbConnected } from './config/mongodb.js';
import { migrateDemoChallans } from './utils/challanSync.js';
import { ensureDefaultCmsPages } from './utils/ensureCms.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Customer-facing routes
import authRoutes from './routes/auth.js';
import challanRoutes from './routes/challan.js';
import challanReceiptRoutes from './routes/challanReceipt.js';
import vehicleRoutes from './routes/vehicle.js';
import paymentRoutes from './routes/payment.js';
import externalApiRoutes from './routes/externalApi.js';
import delhiOtpChallanRoutes from './routes/delhiOtpChallan.js';
import publicConfigRoutes from './routes/publicConfig.js';
import supportRoutes from './routes/support.js';
import { ensureReceiptsDir, RECEIPTS_DIR } from './services/echallanReceipt/paths.js';

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
import adminChallanSearchRoutes from './routes/admin/challanSearches.js';

// Middleware
import { apiLimiter } from './middleware/rateLimiter.js';

import { verifyEmailConnection } from './utils/sendOtp.js';

const app = express();
const PORT = process.env.PORT || 5000;

// cPanel uses Phusion Passenger — export app instead of calling listen()
const isPassenger = Boolean(process.env.PASSENGER_APP_ENV || process.env.PHUSION_PASSENGER);

let httpServer;
let io;

if (!isPassenger) {
  httpServer = createServer(app);

  // Socket.IO for real-time updates (not available on cPanel Passenger)
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

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
}

app.set('io', io || null);

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://challanone.com',
  'https://www.challanone.com',
  'https://admin.challanone.com',
  'https://challan-6em3pm74m-mohits-projects-af211191.vercel.app',
  'https://challanone.vercel.app',
  /\.vercel\.app$/
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

async function bootstrap() {
  await connectDB();

  if (isDbConnected()) {
    try {
      await migrateDemoChallans();
      await ensureDefaultCmsPages();
    } catch (err) {
      console.error('Bootstrap data setup failed:', err.message);
    }
  } else {
    console.warn('⚠️ Skipping DB seed — MongoDB not connected (check hosting allows outbound port 27017)');
  }

  const emailReady = await verifyEmailConnection();
  if (emailReady) {
    console.log('📧 Email service is ready');
  } else {
    console.log('⚠️ Email service is not configured properly');
  }
}

const bootstrapPromise = bootstrap();

if (isPassenger) {
  app.use(async (req, res, next) => {
    try {
      await bootstrapPromise;
      next();
    } catch (err) {
      console.error('Bootstrap failed:', err);
      res.status(503).json({ error: 'Server is starting up, please retry' });
    }
  });
}

// Saved government challan receipts (PDF/HTML)
ensureReceiptsDir();
app.use('/receipts', express.static(RECEIPTS_DIR, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Customer-facing routes
app.use('/api/auth', authRoutes);
// Mount receipt routes before /api/challan/:vehicleNumber
app.use('/api/challan/receipt', challanReceiptRoutes);
app.use('/api/challan', challanRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/external', externalApiRoutes);
app.use('/api/delhi-otp', delhiOtpChallanRoutes);
app.use('/api/config', publicConfigRoutes);
app.use('/api/support', supportRoutes);

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
app.use('/api/admin/challan-searches', apiLimiter, adminChallanSearchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Outbound IP — use this value when whitelisting with APIClub / ChallanWala
app.get('/api/health/outbound-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    res.json({
      outboundIp: data.ip,
      note: 'Whitelist this IP with APIClub and ChallanWala',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

if (!isPassenger) {
  bootstrapPromise.then(() => {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`👑 Admin API ready at http://localhost:${PORT}/api/admin`);
    });
  });
}

export default app;
