import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';

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
import shopifyRoutes from './routes/shopifyRoutes';
import storeRoutes from './routes/storeRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import connectedStoreRoutes from './routes/connectedStoreRoutes';
import webhookRoutes from './routes/webhookRoutes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/connected-stores', connectedStoreRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start background jobs
import { BackgroundJobsService } from './services/BackgroundJobsService';

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS enabled for: ${config.corsOrigin}`);
      
      // Start background jobs if multi-tenant mode is enabled
      if (process.env.MULTI_TENANT_STORES_ENABLED === 'true') {
        BackgroundJobsService.start();
        console.log(`🔐 Multi-tenant mode enabled`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      BackgroundJobsService.stop();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      BackgroundJobsService.stop();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

