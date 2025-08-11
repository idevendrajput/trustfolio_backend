const Category = require('../models/Category');

// @desc    Get all categories (for home page)
// @route   GET /api/categories
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, sort = 'sortOrder name' } = req.query;
    
    // Build query object - only active categories for public
    let query = { isActive: true };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get categories with pagination
    const categories = await Category.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip(skip)
      .select('name slug title description image sortOrder created_at updated_at')
      .exec();
    
    // Get total count for pagination
    const total = await Category.countDocuments(query);
    
    res.json({
      success: true,
      data: categories,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        per_page: parseInt(limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Get all categories for admin (including inactive)
// @route   GET /api/categories/admin/all
// @access  Private (Admin only)
const getAllCategoriesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sort = 'sortOrder name', status } = req.query;
    
    // Build query object - all categories for admin
    let query = {};
    
    // Filter by status if provided
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get categories with pagination
    const categories = await Category.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip(skip)
      .exec();
    
    // Get total count for pagination
    const total = await Category.countDocuments(query);
    
    // Get counts by status
    const activeCount = await Category.countDocuments({ isActive: true });
    const inactiveCount = await Category.countDocuments({ isActive: false });
    
    res.json({
      success: true,
      data: categories,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        per_page: parseInt(limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      },
      stats: {
        total: total,
        active: activeCount,
        inactive: inactiveCount
      }
    });
  } catch (error) {
    console.error('Get Admin Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Get single category by ID or slug
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's MongoDB ObjectId or slug
    let category;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId
      category = await Category.findById(id);
    } else {
      // It's a slug
      category = await Category.findOne({ slug: id });
    }
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
const createCategory = async (req, res) => {
  try {
    const { name, title, description, image, isActive = true, sortOrder = 0 } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug: name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-') }]
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    // Create new category
    const category = await Category.create({
      name,
      title,
      description,
      image,
      isActive,
      sortOrder
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create Category Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating category',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // If name is being updated, regenerate slug
    if (updateData.name && updateData.name !== category.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update Category Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating category',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete category
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: { deleted_category: category }
    });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Toggle category active status
// @route   PATCH /api/categories/:id/toggle-status
// @access  Private (Admin only)
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Toggle status
    category.isActive = !category.isActive;
    await category.save();
    
    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Toggle Category Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating category status',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
};
