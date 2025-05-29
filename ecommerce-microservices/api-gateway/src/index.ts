// src/index.ts
import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Service URLs from environment variables
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Health check for the gateway itself
app.get('/gateway/health', (req, res) => {
    res.json({ status: 'UP', service: 'API Gateway' });
});

// Proxy routes
// Any request to /api/users/* will be forwarded to User Service
app.use('/api/users', proxy(userServiceUrl, {
    proxyReqPathResolver: (req) => `/api/v1/users${req.url}`, // Assuming user service routes are prefixed with /api/v1/users
    proxyErrorHandler: (err, res, next) => {
        console.error('[API Gateway] Proxy error to User Service:', err);
        if (!res.headersSent) {
            res.status(503).json({ error: 'Service unavailable', service: 'User Service' });
        }
    }
}));

// Any request to /api/products/* will be forwarded to Product Service
app.use('/api/products', proxy(productServiceUrl, {
    proxyReqPathResolver: (req) => `/api/v1/products${req.url}`, // Assuming product service routes are prefixed with /api/v1/products
    proxyErrorHandler: (err, res, next) => {
        console.error('[API Gateway] Proxy error to Product Service:', err);
        if (!res.headersSent) {
            res.status(503).json({ error: 'Service unavailable', service: 'Product Service' });
        }
    }
}));

// Catch-all for unhandled routes by the gateway
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found on API Gateway' });
});

// Basic Error Handler for the gateway itself (e.g., if JSON parsing fails)
// Added type for err for clarity, though 'any' is often used in default Express handlers
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[API Gateway] Error:", err);
    if (!res.headersSent) {
        // Express default error handler might have a status property on err
        // For custom errors, you might need to cast or check.
        const statusCode = (err as any).status || 500;
        res.status(statusCode).json({
            error: err.message || "Internal Server Error on API Gateway",
        });
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on http://localhost:${PORT}`);
    console.log(`Proxying to User Service at ${userServiceUrl}`);
    console.log(`Proxying to Product Service at ${productServiceUrl}`);
});
