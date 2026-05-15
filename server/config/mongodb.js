// MongoDB connection config
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ CRITICAL: MONGODB_URI environment variable is not set!');
  console.error('   Please add MONGODB_URI to your Render environment variables.');
  // Don't exit — let server start so we can see health check, but DB routes will fail
}

let isConnected = false;

export async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ Cannot connect to MongoDB: MONGODB_URI is not set.');
    return;
  }
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit — allow health check to remain reachable
    isConnected = false;
  }
}

export default mongoose;
