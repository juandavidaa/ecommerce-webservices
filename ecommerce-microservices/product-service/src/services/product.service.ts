import Product, { IProduct } from '../models/product.model';
import { ApiError } from '../utils/apiError.utils';

const createProduct = async (productData: Partial<IProduct>): Promise<IProduct> => {
  const { name, description, price, stock, sku } = productData;

  if (!name || !description || price === undefined || stock === undefined || !sku) {
    throw new ApiError(400, 'Name, description, price, stock, and SKU are required');
  }

  if (price < 0) {
    throw new ApiError(400, 'Price cannot be negative');
  }
  if (stock < 0) {
    throw new ApiError(400, 'Stock cannot be negative');
  }

  const existingProductBySku = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingProductBySku) {
    throw new ApiError(409, `Product with SKU ${sku} already exists`);
  }

  try {
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      sku: sku.toUpperCase(), // Ensure SKU is stored in uppercase
    });
    const savedProduct = await newProduct.save();
    return savedProduct;
  } catch (error: any) {
    console.error('Error creating product:', error);
    // Check for Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      throw new ApiError(400, 'Validation Error', messages);
    }
    throw new ApiError(500, 'Error creating product. Please try again later.');
  }
};

const getAllProducts = async (): Promise<IProduct[]> => {
  // For now, fetches all products. Pagination can be added later.
  const products = await Product.find({});
  return products;
};

const getProductById = async (productId: string): Promise<IProduct> => {
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) { // Basic check for ObjectId validity
    throw new ApiError(400, 'Invalid Product ID format');
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

const getProductBySku = async (sku: string): Promise<IProduct> => {
  if (!sku || sku.trim() === '') {
    throw new ApiError(400, 'SKU must be provided');
  }
  const product = await Product.findOne({ sku: sku.toUpperCase() }); // Search in uppercase
  if (!product) {
    throw new ApiError(404, `Product with SKU ${sku} not found`);
  }
  return product;
};

export const productService = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySku,
};
