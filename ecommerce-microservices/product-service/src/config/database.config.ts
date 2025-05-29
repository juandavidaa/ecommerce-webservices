import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configure dotenv to load environment variables from .env file in the service root
dotenv.config({ path: './.env' });

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.PRODUCT_DB_URI) {
      console.error('PRODUCT_DB_URI is not defined in your environment variables.');
      process.exit(1);
    }
    await mongoose.connect(process.env.PRODUCT_DB_URI);
    console.log('MongoDB connected successfully to Product Service DB');

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected from Product Service DB');
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

export { connectDB };
