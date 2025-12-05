import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { HealthCheckService } from './services/HealthCheckService';

const app = express();

// Trust proxy (important for detecting HTTPS behind reverse proxy)
// This allows req.protocol to correctly detect HTTPS when behind nginx/load balancer
app.set('trust proxy', true);

// Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Serve static files from public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

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
import uploadRoutes from './routes/uploadRoutes';
import orderRoutes from './routes/orderRoutes';
import contentRoutes from './routes/contentRoutes';
import autoOrderRoutes from './routes/fakeOrderRoutes';
import walletRoutes from './routes/walletRoutes';
import zenOrderRoutes from './routes/zenOrderRoutes';
import customerRoutes from './routes/customerRoutes';
import userEmailSenderRoutes from './routes/userEmailSenderRoutes';
import videoMutatorRoutes from './routes/videoMutatorRoutes';
import videoMutatorAdminRoutes from './routes/videoMutatorAdminRoutes';
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
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auto-orders', autoOrderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin/zen-orders', zenOrderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/email-sender', userEmailSenderRoutes);
app.use('/api/video-mutator', videoMutatorRoutes);
app.use('/api/admin/video-mutator', authenticateToken, requireAdmin, videoMutatorAdminRoutes);
// Content and ad builder routes
app.use('/api', contentRoutes);
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
    
    // Start video cleanup service (deletes videos older than 3 days)
    const { startVideoCleanupService } = await import('./services/videoCleanupService');
    startVideoCleanupService();
    
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

