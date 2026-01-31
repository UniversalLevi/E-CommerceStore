import express, { Request, Response } from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { HealthCheckService } from './services/HealthCheckService';
import { SubscriptionExpirationService } from './services/subscriptionExpirationService';

const app = express();

// Trust proxy (important for detecting HTTPS behind reverse proxy)
// This allows req.protocol to correctly detect HTTPS when behind nginx/load balancer
app.set('trust proxy', true);

// Middleware
app.use(morgan('dev'));

// CORS configuration: Only enable in development (Apache handles it in production)
if (config.nodeEnv === 'development') {
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));
  console.log('🔧 CORS enabled for development (localhost:3000)');
} else {
  // In production, CORS is handled by Apache at the proxy level
  console.log('🔗 CORS handled by Apache proxy');
}
// Razorpay webhook needs raw body, so register it before JSON parser
app.use('/api/store-dashboard/razorpay/webhook', express.raw({ type: 'application/json' }));
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
import templateRoutes from './routes/templateRoutes';
import templateAdminRoutes from './routes/templateAdminRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import userSubscriptionRoutes from './routes/userSubscriptionRoutes';
import storeDashboardRoutes from './routes/storeDashboardRoutes';
import storeProductImportRoutes from './routes/storeProductImportRoutes';
import storefrontRoutes from './routes/storefrontRoutes';
import storeRazorpayWebhookRoutes from './routes/storeRazorpayWebhookRoutes';
import serviceRoutes from './routes/serviceRoutes';
import affiliateRoutes from './routes/affiliateRoutes';
import adminAffiliateRoutes from './routes/adminAffiliateRoutes';
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
app.use('/api/subscriptions', userSubscriptionRoutes);
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
// Service routes
app.use('/api/services', serviceRoutes);
// Mentorship routes (public POST, admin for GET/PUT)
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/admin/mentorship', mentorshipRoutes);
// Template routes
app.use('/api/templates', templateRoutes);
app.use('/api/admin/templates', templateAdminRoutes);
// WhatsApp Bulk Product Intake routes
app.use('/api/whatsapp', whatsappRoutes);
// Store Dashboard routes
app.use('/api/store-dashboard', storeDashboardRoutes);
// Store Product Import routes
app.use('/api/store-dashboard', storeProductImportRoutes);
// Storefront routes (public)
app.use('/api/storefront', storefrontRoutes);
// Razorpay Connect webhook (must be before JSON parser for raw body)
app.use('/api/store-dashboard/razorpay', storeRazorpayWebhookRoutes);
// Affiliate routes
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/admin/affiliates', adminAffiliateRoutes);

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
    
    // Start subscription expiration service (expires trials that ended without payment)
    SubscriptionExpirationService.start();
    
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS handled by Apache proxy`);
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
  SubscriptionExpirationService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  HealthCheckService.stop();
  SubscriptionExpirationService.stop();
  process.exit(0);
});

startServer();

