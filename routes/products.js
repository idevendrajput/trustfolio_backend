const express = require('express');
const {
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  cleanOldProducts,
  getProductStats
} = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/stats', getProductStats); // Public stats endpoint
router.get('/:id', getProductById);

// Admin routes (must be before /:id route to avoid conflicts)
router.get('/admin/all', authenticate, requireRole('admin', 'super_admin'), (req, res) => {
  req.query.isAdmin = true;
  return getProducts(req, res);
});

router.get('/admin/stats', authenticate, requireRole('admin', 'super_admin'), getProductStats);

// Protected routes (Admin only)
router.put('/:id', authenticate, requireRole('admin', 'super_admin'), updateProduct);
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), deleteProduct);

// Bulk operations (Admin only)
router.post('/bulk-delete', authenticate, requireRole('admin', 'super_admin'), bulkDeleteProducts);
router.post('/clean-old', authenticate, requireRole('admin', 'super_admin'), cleanOldProducts);

module.exports = router;
