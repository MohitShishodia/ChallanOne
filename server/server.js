import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import challanRoutes from './routes/challan.js';
import vehicleRoutes from './routes/vehicle.js';
import paymentRoutes from './routes/payment.js';
import { verifyEmailConnection } from './utils/sendOtp.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challan', challanRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Verify email connection
  const emailReady = await verifyEmailConnection();
  if (emailReady) {
    console.log('📧 Email service is ready');
  } else {
    console.log('⚠️ Email service is not configured properly');
  }
});

