import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configure dotenv to load environment variables from .env file
dotenv.config({ path: './.env' }); // Ensure .env is loaded if not already by index.ts

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.USER_DB_URI) {
      console.error('USER_DB_URI is not defined in your environment variables.');
      process.exit(1); // Exit the process with an error code
    }
    await mongoose.connect(process.env.USER_DB_URI);
    console.log('MongoDB connected successfully to User Service DB');

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected from User Service DB');
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1); // Exit the process with an error code
  }
};

export { connectDB };
