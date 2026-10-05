import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { validateProductPayload, validateSkuPayload } from '../middleware/validate.js';

import { createCategory, getCategoryTree } from '../controllers/categories.js';
import { createProduct, updateProduct, listProducts } from '../controllers/products.js';
import { createVariantAndSku, updateSku } from '../controllers/skus.js';

const router = Router();

// Apply auth middleware globally across all admin endpoints
router.use(requireAdmin);

// Category Endpoints
router.post('/categories', createCategory);
router.get('/categories', getCategoryTree);

// Product Endpoints
router.post('/products', validateProductPayload, createProduct);
router.patch('/products/:id', updateProduct);
router.get('/products', listProducts);

// Variant & SKU Endpoints
router.post('/products/:id/skus', validateSkuPayload, createVariantAndSku);
router.patch('/skus/:id', updateSku);

export default router;