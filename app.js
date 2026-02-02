require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const connectDB = require('./server/Config/db');

// Import routes
// Import routes
const authRoutes = require('./server/Routes/authRoutes');
const jobRoutes = require('./server/Routes/jobRoutes');
const resumeRoutes = require('./server/Routes/resumeRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration - supports multiple origins for dev and production
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5174',  // Vite fallback port
  'http://localhost:3000',  // Alternative local
  process.env.CLIENT_URL    // Production URL from env
].filter(Boolean);

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(hpp()); // Prevent HTTP Parameter Pollution

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Allow any localhost origin (for development)
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow production CLIENT_URL if set
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parser middleware - must come before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Debug middleware (remove in production)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Request Body:', req.body);
      console.log('Content-Type:', req.get('Content-Type'));
    }
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resume', resumeRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - catch all routes that don't match
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
