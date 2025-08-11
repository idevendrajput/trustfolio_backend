const express = require('express');
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  startScraping,
  scrapeCategoryProducts,
  getScrapingStatus,
  stopScraping,
  getProductStats
} = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

// Admin scraping routes
router.post('/scraping/start', authenticate, requireRole('admin', 'super_admin'), startScraping);
router.post('/scraping/stop', authenticate, requireRole('admin', 'super_admin'), stopScraping);
router.get('/scraping/status', authenticate, requireRole('admin', 'super_admin'), getScrapingStatus);
router.post('/scraping/category/:categoryId', authenticate, requireRole('admin', 'super_admin'), scrapeCategoryProducts);

// Admin stats routes
router.get('/admin/stats', authenticate, requireRole('admin', 'super_admin'), getProductStats);

module.exports = router;
