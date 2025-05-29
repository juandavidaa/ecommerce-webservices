import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs'; // Corrected import name

// Define the User interface (optional but good practice)
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because it will be removed in some responses
  isPasswordCorrect(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Pre-save hook to hash the password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to compare passwords
UserSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  if (!this.password) return false; // Should not happen if password is required
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
