import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

// Configure dotenv to load environment variables
dotenv.config();

const app = express();

// Define the port
const port = process.env.USER_SERVICE_PORT || 3000;

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'User Service',
  });
});

// Start the server
app.listen(port, () => {
  console.log(`User Service listening on port ${port}`);
});
