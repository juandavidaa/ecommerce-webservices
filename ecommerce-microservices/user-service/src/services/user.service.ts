import User, { IUser } from '../models/user.model';
import { ApiError } from '../utils/apiError.utils';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { publishToExchange } from '../utils/rabbitmq.utils'; // Import RabbitMQ publisher

dotenv.config({ path: '../.env' }); // Ensure .env is loaded relative to this file if not already by index.ts

// Helper function to omit password from user object
const omitPassword = (user: IUser): Omit<IUser, 'password' | 'isPasswordCorrect'> => {
  const { password, isPasswordCorrect, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
  return userWithoutPassword as Omit<IUser, 'password' | 'isPasswordCorrect'>;
};


const registerUser = async (userData: Pick<IUser, 'name' | 'email' | 'password'>): Promise<Omit<IUser, 'password' | 'isPasswordCorrect'>> => {
  const { name, email, password } = userData;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  let savedUser: IUser;
  try {
    const newUser = new User({ name, email, password });
    savedUser = await newUser.save();
  } catch (error: any) {
    // Log the detailed error for server-side inspection
    console.error('Error during user registration (save operation):', error);
    // Throw a generic error to the client
    throw new ApiError(500, 'Error registering user. Please try again later.', error.errors || []);
  }

  // Fetch the user again to ensure we have the latest version and omit password correctly
  // The 'omitPassword' helper might not work as expected if 'savedUser' isn't a full Mongoose document with .toObject()
  // or if virtuals/methods are not properly applied after a direct save.
  const createdUserWithoutPasswordDoc = await User.findById(savedUser._id).select('-password').lean(); // Use .lean() for plain object

  if (!createdUserWithoutPasswordDoc) {
      console.error('Failed to fetch created user after save:', savedUser._id);
      throw new ApiError(500, 'Something went wrong while fetching created user details');
  }

  // Publish user registered event
  try {
      await publishToExchange('user_events', 'user.registered', {
          userId: createdUserWithoutPasswordDoc._id, // Use _id from the fetched document
          email: createdUserWithoutPasswordDoc.email,
          name: createdUserWithoutPasswordDoc.name,
          registeredAt: new Date(createdUserWithoutPasswordDoc.createdAt).toISOString(), // Ensure date is in standard format
      });
  } catch (publishError) {
      // Log the error, but don't let it fail the registration process
      console.error('Failed to publish user.registered event:', publishError);
  }

  // It's better to return the object that was used for publishing to ensure consistency
  // and that it's indeed password-omitted and a plain object if needed downstream.
  return createdUserWithoutPasswordDoc as Omit<IUser, 'password' | 'isPasswordCorrect'>;
};

const loginUser = async (credentials: Pick<IUser, 'email' | 'password'>): Promise<{ user: Omit<IUser, 'password' | 'isPasswordCorrect'>; token: string }> => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password'); // Explicitly select password
  if (!user) {
    throw new ApiError(404, 'User not found. Please check your email or register.');
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials. Please check your email and password.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined. Cannot generate token.');
    throw new ApiError(500, 'Server configuration error. Please try again later.');
  }
  if (!jwtExpiresIn) {
    console.error('JWT_EXPIRES_IN is not defined. Cannot generate token.');
    throw new ApiError(500, 'Server configuration error. Please try again later.');
  }

  const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  return { user: omitPassword(user), token };
};

export const userService = {
  registerUser,
  loginUser,
};
