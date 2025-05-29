import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database.config';
import productRouter from './routes/product.routes'; // Import product router
import { ApiError } from './utils/apiError.utils';
import { connectRabbitMQ } from './utils/rabbitmq.utils'; // Import RabbitMQ connector
import { setupUserSubscribers } from './subscribers/user.subscriber'; // Import user subscriber setup

// Configure dotenv to load environment variables from .env file
dotenv.config({ path: './.env' });

const app = express();

// ---- Middlewares ----
app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));


// ---- Database, RabbitMQ Connection, and Subscriber Setup ----
(async () => {
  try {
    await connectDB(); // Call connectDB from database.config.ts
    await connectRabbitMQ(); // Call connectRabbitMQ for Product Service
    await setupUserSubscribers(); // Setup RabbitMQ subscribers for user events

    // ---- API Routes ----
    app.use('/api/v1/products', productRouter);

    // ---- Health Check Endpoint ----
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'UP',
        service: 'Product Service',
        timestamp: new Date().toISOString(),
      });
    });

    // ---- Default Route for unmatched paths ----
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        });
    });

    // ---- Global Error Handling Middleware ----
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      let error = err;
      if (!(err instanceof ApiError)) {
        const statusCode = err.statusCode || err.status || 500;
        const message = err.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, err.errors || [], err.stack);
      }

      const responsePayload = {
        success: false,
        message: error.message,
        errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
        ...(process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {}),
      };
      
      console.error(`[Error Middleware - Product Service] ${error.statusCode} - ${error.message}`, {
        path: req.path,
        method: req.method,
        ...(process.env.NODE_ENV === 'development' ? { body: req.body, params: req.params, query: req.query } : {}),
        stack: error.stack
      });

      return res.status(error.statusCode).json(responsePayload);
    });


    // ---- Start the Server ----
    const port = process.env.PRODUCT_SERVICE_PORT || 3002; // Default for Product service
    app.listen(port, () => {
      console.log(`Product Service listening on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) { // Catch errors from connectDB, connectRabbitMQ, or setupUserSubscribers
    console.error('Failed to initialize service dependencies (Product Service). Application not started.', error);
    process.exit(1); // Exit if essential connections/setups fail
  }
})();
