import { Router } from 'express';
import {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  getProductBySkuController,
} from '../controllers/product.controller';

const router = Router();

// Create a new product
router.post('/', createProductController);

// Get all products
router.get('/', getAllProductsController);

// Get a product by its MongoDB ID
router.get('/id/:id', getProductByIdController);

// Get a product by its SKU
router.get('/sku/:sku', getProductBySkuController);

// Placeholder for Update Product (PUT /:id or /sku/:sku) - To be implemented later
// router.put('/id/:id', (req, res) => res.status(501).json({ message: 'Not Implemented' }));
// router.put('/sku/:sku', (req, res) => res.status(501).json({ message: 'Not Implemented' }));

// Placeholder for Delete Product (DELETE /:id or /sku/:sku) - To be implemented later
// router.delete('/id/:id', (req, res) => res.status(501).json({ message: 'Not Implemented' }));
// router.delete('/sku/:sku', (req, res) => res.status(501).json({ message: 'Not Implemented' }));


export default router;
