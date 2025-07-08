const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const ideasRoutes = require('./routes/ideas');
const escrowRoutes = require('./routes/escrow');
const questionsRoutes = require('./routes/questions');
const answersRoutes = require('./routes/answers'); // New route
const expertRoutes = require('./routes/expert');
const matchingRoutes = require('./routes/matching');
const notificationRoutes = require('./routes/notifications');// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MONEY TALKS API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/answers', answersRoutes); // New route
app.use('/api/expert', expertRoutes);
app.use('/api/matching', matchingRoutes);
// 404 handler
app.use('/api/notifications', notificationRoutes);app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Prisma error handling
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Duplicate entry',
      message: 'This record already exists'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'Record not found'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 MONEY TALKS API running on port ${PORT}
📝 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base URL: http://localhost:${PORT}/api
  `);
});