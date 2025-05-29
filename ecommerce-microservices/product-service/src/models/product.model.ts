import mongoose, { Schema, Document } from 'mongoose';

// Define the Product interface (optional but good practice)
export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string; // Stock Keeping Unit
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Often SKUs are stored in uppercase for consistency
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
