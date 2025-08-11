const express = require('express');
const {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} = require('../controllers/categoryController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin routes (must be before /:id route)
router.get('/admin/all', authenticate, requireRole('admin', 'super_admin'), getAllCategoriesAdmin);

// Protected routes (Admin only)
router.post('/', authenticate, requireRole('admin', 'super_admin'), createCategory);
router.put('/:id', authenticate, requireRole('admin', 'super_admin'), updateCategory);
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), deleteCategory);

// Toggle category status (Admin only)
router.patch('/:id/toggle-status', authenticate, requireRole('admin', 'super_admin'), toggleCategoryStatus);

module.exports = router;
