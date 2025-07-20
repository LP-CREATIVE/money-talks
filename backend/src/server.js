const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Trust proxy for Railway HTTPS
app.set("trust proxy", true);

// Force HTTPS headers
const forceHttps = require("./middleware/forceHttps");
app.use(forceHttps);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const ideasRoutes = require('./routes/ideas');
const escrowRoutes = require('./routes/escrow');
const questionsRoutes = require('./routes/questions');
const answersRoutes = require('./routes/answers');
const philosophyRoutes = require('./routes/philosophy');
const expertRoutes = require('./routes/expert');
const expertOnboardingRoutes = require('./routes/expertOnboarding');
const adminRoutes = require('./routes/admin');
const matchingRoutes = require('./routes/matching');
const observablePatternsRoutes = require('./routes/observablePatterns');
const notificationRoutes = require('./routes/notifications');
const expertProfileRoutes = require('./routes/expertProfile');
const resaleRoutes = require('./routes/resale');
const affiliateRoutes = require('./routes/affiliate');
const paymentRoutes = require('./routes/payment');
const queueRoutes = require('./routes/queue');
const demoRoutes = require('./routes/demo');

// Health check
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
app.use('/api/answers', answersRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/expert/observable', observablePatternsRoutes);
app.use('/api/expert-details', expertProfileRoutes);
app.use('/api/expert-onboarding', expertOnboardingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/philosophy', philosophyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/resale', resaleRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/demo', demoRoutes);

// 404 handler
app.use((req, res) => {
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

// Start cron jobs
const { startCronJobs } = require('./cron/paymentCronJobs');
startCronJobs();
