const express = require('express');
const {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  seedCategories
} = require('../controllers/categoryController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin routes (must be before /:id route)
router.get('/admin/all', authenticate, requireRole('admin', 'super_admin'), getAllCategoriesAdmin);

// Image upload route
router.post('/upload-image', authenticate, requireRole('admin', 'super_admin'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    
    const imageUrl = `/uploads/categories/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Image upload failed', error: error.message });
  }
});

// Protected routes (Admin only)
router.post('/', authenticate, requireRole('admin', 'super_admin'), createCategory);
router.put('/:id', authenticate, requireRole('admin', 'super_admin'), updateCategory);
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), deleteCategory);

// Toggle category status (Admin only)
router.patch('/:id/toggle-status', authenticate, requireRole('admin', 'super_admin'), toggleCategoryStatus);

// Seed electronics categories (Super Admin only)
router.post('/seed-electronics', authenticate, requireRole('super_admin'), seedCategories);

module.exports = router;
