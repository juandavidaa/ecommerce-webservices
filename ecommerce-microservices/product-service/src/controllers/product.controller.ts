import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError.utils';
import { ApiResponse } from '../utils/apiResponse.utils';
import { productService } from '../services/product.service';
import { IProduct } from '../models/product.model'; // Import IProduct for type safety

const createProductController = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, price, stock, sku } = req.body as Partial<IProduct>;

  // More robust validation can be added here or in a dedicated middleware
  if (!name || !description || price === undefined || stock === undefined || !sku) {
    throw new ApiError(400, 'Missing required fields: name, description, price, stock, sku');
  }
  if (typeof price !== 'number' || price < 0) {
    throw new ApiError(400, 'Price must be a non-negative number');
  }
  if (typeof stock !== 'number' || stock < 0) {
    throw new ApiError(400, 'Stock must be a non-negative number');
  }
  if (typeof sku !== 'string' || sku.trim() === '') {
      throw new ApiError(400, 'SKU must be a non-empty string');
  }


  const productData: Partial<IProduct> = { name, description, price, stock, sku };
  const newProduct = await productService.createProduct(productData);

  res.status(201).json(
    new ApiResponse(201, newProduct, 'Product created successfully')
  );
});

const getAllProductsController = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getAllProducts();
  res.status(200).json(
    new ApiResponse(200, products, 'Products retrieved successfully')
  );
});

const getProductByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, 'Product ID is required in path parameter');
  }
  const product = await productService.getProductById(id);
  res.status(200).json(
    new ApiResponse(200, product, 'Product retrieved successfully')
  );
});

const getProductBySkuController = asyncHandler(async (req: Request, res: Response) => {
  const { sku } = req.params;
   if (!sku) {
    throw new ApiError(400, 'Product SKU is required in path parameter');
  }
  const product = await productService.getProductBySku(sku);
  res.status(200).json(
    new ApiResponse(200, product, 'Product retrieved successfully')
  );
});

export {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  getProductBySkuController,
};
