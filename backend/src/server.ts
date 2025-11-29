import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { HealthCheckService } from './services/HealthCheckService';

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Import routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import storeRoutes from './routes/storeRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/adminRoutes';
import nicheRoutes from './routes/nicheRoutes';
import nicheAdminRoutes from './routes/nicheAdminRoutes';
import contactRoutes from './routes/contactRoutes';
import activityRoutes from './routes/activityRoutes';
import searchRoutes from './routes/searchRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import paymentRoutes from './routes/paymentRoutes';
import aiRoutes from './routes/aiRoutes';
import mentorshipRoutes from './routes/mentorshipRoutes';
import { authenticateToken, requireAdmin } from './middleware/auth';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
// Niche routes (separate namespaces to prevent route overlap)
app.use('/api/niches', nicheRoutes);
app.use('/api/admin/niches', authenticateToken, requireAdmin, nicheAdminRoutes);
// Mentorship routes (admin only)
app.use('/api/admin/mentorship', mentorshipRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Start health check service
    HealthCheckService.start();
    
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS enabled for: ${config.corsOrigin}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  HealthCheckService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  HealthCheckService.stop();
  process.exit(0);
});

startServer();

