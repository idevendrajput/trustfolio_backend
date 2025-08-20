const express = require('express');
const {
  searchProducts,
  getProductDetails,
  getBulkProductDetails,
  getCategoryQueries,
  previewCategoryProducts,
  syncCategoryProducts,
  syncAllCategories,
  syncOutdatedProducts,
  getSyncStatus,
  testApi
} = require('../controllers/amazonSyncController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public endpoints
router.get('/test', testApi);
router.post('/search', searchProducts);
router.post('/product-details', getProductDetails);
router.post('/bulk-product-details', getBulkProductDetails);
router.get('/category/:category/queries', getCategoryQueries);
router.post('/category/preview', previewCategoryProducts);

// Protected admin endpoints
router.use(authenticate);
router.use(requireRole('admin', 'super_admin'));

// Sync operations
router.post('/sync/category/:categoryId', syncCategoryProducts);
router.post('/sync/all-categories', syncAllCategories);
router.post('/sync/outdated-products', syncOutdatedProducts);
router.get('/sync/status', getSyncStatus);

module.exports = router;
