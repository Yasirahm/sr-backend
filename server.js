import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

import courseRoutes from './routes/courseRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Direct File Upload from Device Endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mime = matches[1];
      const cleanExt = mime.includes('png')
        ? 'png'
        : mime.includes('webp')
        ? 'webp'
        : mime.includes('svg')
        ? 'svg'
        : 'jpg';
      const base64Data = matches[2];
      const safeName = (name || 'photo').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
      const fileName = `${safeName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${cleanExt}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      return res.json({
        success: true,
        url: `/uploads/${fileName}`,
        name: fileName,
      });
    }

    return res.json({ success: true, url: image });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Failed to save uploaded image' });
  }
});

// Simple Authentication System (Can easily be upgraded to JWT / bcrypt)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'yasir',
  password: process.env.ADMIN_PASSWORD || '22250040',
};

// Auth Route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    // Return a session token simulation that frontend stores in localStorage
    return res.json({
      success: true,
      token: 'admin-auth-token-session-' + Date.now(),
      user: {
        username: ADMIN_CREDENTIALS.username,
        role: 'admin',
      },
      message: 'Login successful',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password',
  });
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1
      ? 'connected'
      : mongoose.connection.readyState === 2
      ? 'connecting'
      : 'disconnected';

  res.json({
    status: 'ok',
    website: 'Sara Aijaz API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// MongoDB Connection
const connectDB = async () => {
  if (!MONGO_URI) {
    console.warn(
      '⚠️  MONGO_URI not provided in .env. Server running with in-memory persistence fallback for seamless demo.'
    );
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️  Falling back to in-memory store so the app never crashes.');
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Sara Aijaz Backend running on http://localhost:${PORT}`);
});

export default app;
