import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import { connectDB } from './config/database.config';
import userRouter from './routes/user.routes'; // Import user router
import { ApiError } from './utils/apiError.utils';
import { connectRabbitMQ } from './utils/rabbitmq.utils'; // Import RabbitMQ connector

// Configure dotenv to load environment variables from .env file
// Ensure this is at the top to make variables available globally
dotenv.config({ path: './.env' });

const app = express();

// ---- Middlewares ----
// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '16kb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '16kb' }));


// ---- Database and RabbitMQ Connection ----
// Wrap in an async IIFE to use await
(async () => {
  try {
    await connectDB(); // Call connectDB from database.config.ts
    await connectRabbitMQ(); // Call connectRabbitMQ from rabbitmq.utils.ts

    // ---- API Routes ----
    // Mount the user router with /api/v1 prefix
    app.use('/api/v1/users', userRouter);

    // ---- Health Check Endpoint ----
    // Should be defined after essential middlewares and before error handlers
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'UP',
        service: 'User Service',
        timestamp: new Date().toISOString(),
      });
    });
    
    // ---- Default Route for unmatched paths (Optional but good for API discovery) ----
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        });
    });

    // ---- Global Error Handling Middleware ----
    // This should be the last middleware added
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      let error = err;
      if (!(err instanceof ApiError)) {
        const statusCode = err.statusCode || err.status || 500; // Use err.status as fallback for some libraries
        const message = err.message || 'Internal Server Error';
        // Pass through original errors array if it exists, otherwise empty
        error = new ApiError(statusCode, message, err.errors || [], err.stack);
      }

      // Construct the response object
      const responsePayload = {
        success: false, // Standardize the success field for errors
        message: error.message,
        errors: error.errors && error.errors.length > 0 ? error.errors : undefined, // Only include errors if present
        ...(process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {}),
      };
      
      // Log the error internally (optional, could use a more sophisticated logger)
      console.error(`[Error Middleware] ${error.statusCode} - ${error.message}`, {
        path: req.path,
        method: req.method,
        // Do not log sensitive request body/params in production
        ...(process.env.NODE_ENV === 'development' ? { body: req.body, params: req.params, query: req.query } : {}),
        stack: error.stack // Log stack for debugging
      });

      // Send an error response
      return res.status(error.statusCode).json(responsePayload);
    });


    // ---- Start the Server ----
    const port = process.env.USER_SERVICE_PORT || 3000;
    app.listen(port, () => {
      console.log(`User Service listening on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) { // Catch errors from connectDB or connectRabbitMQ
    console.error('Failed to initialize service dependencies. Application not started.', error);
    process.exit(1); // Exit if essential connections fail
  }
})();
