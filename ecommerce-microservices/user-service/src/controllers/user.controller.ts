import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError.utils';
import { ApiResponse } from '../utils/apiResponse.utils';
import { userService } from '../services/user.service';
import { IUser } from '../models/user.model'; // Import IUser for type safety

const registerUserController = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as Pick<IUser, 'name' | 'email' | 'password'>; // Type assertion

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  // Basic email validation (more comprehensive validation can be added)
  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, 'Invalid email format');
  }

  // Basic password strength (example: at least 6 characters)
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  const createdUser = await userService.registerUser({ name, email, password });

  res.status(201).json(
    new ApiResponse(201, createdUser, 'User registered successfully')
  );
});

const loginUserController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as Pick<IUser, 'email' | 'password'>; // Type assertion

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const { user: loggedInUser, token } = await userService.loginUser({ email, password });

  // In a real application, the token might be sent in an HttpOnly cookie for better security
  res.status(200).json(
    new ApiResponse(200, { user: loggedInUser, token }, 'Login successful')
  );
});

export { registerUserController, loginUserController };
