const Category = require('../models/Category');
const { electronicsCategories } = require('../seed_electronics_categories');

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
      .select('name title description image sortOrder searchKeywords isActive created_at updated_at')
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
    
    // Find by ID only
    const category = await Category.findById(id);
    
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
    const { name, title, description, image, isActive = true, sortOrder = 0, searchKeywords = [] } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    
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
      sortOrder,
      searchKeywords
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

// @desc    Get price ranges for a category
// @route   GET /api/categories/:id/price-ranges
// @access  Private (Admin only)
const getCategoryPriceRanges = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id).select('name title priceRanges scrapingConfig');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        categoryId: category._id,
        categoryName: category.name,
        categoryTitle: category.title,
        priceRanges: category.priceRanges || [],
        scrapingConfig: category.scrapingConfig || {
          maxProductsPerRange: 20,
          maxPages: 2,
          scrapingStatus: 'pending'
        }
      }
    });
  } catch (error) {
    console.error('Get Price Ranges Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching price ranges',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Update price ranges for a category
// @route   PUT /api/categories/:id/price-ranges
// @access  Private (Admin only)
const updateCategoryPriceRanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { priceRanges, scrapingConfig } = req.body;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Validate price ranges format
    if (priceRanges) {
      for (const range of priceRanges) {
        if (!range.name || !range.label || typeof range.min !== 'number' || typeof range.max !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'Invalid price range format. Each range must have name, label, min, and max.'
          });
        }
      }
    }
    
    // Update data
    const updateData = {};
    if (priceRanges) updateData.priceRanges = priceRanges;
    if (scrapingConfig) updateData.scrapingConfig = { ...category.scrapingConfig, ...scrapingConfig };
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('name title priceRanges scrapingConfig');
    
    res.json({
      success: true,
      message: 'Price ranges updated successfully',
      data: {
        categoryId: updatedCategory._id,
        categoryName: updatedCategory.name,
        categoryTitle: updatedCategory.title,
        priceRanges: updatedCategory.priceRanges,
        scrapingConfig: updatedCategory.scrapingConfig
      }
    });
  } catch (error) {
    console.error('Update Price Ranges Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating price ranges',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Reset price ranges for a category to default
// @route   POST /api/categories/:id/price-ranges/reset
// @access  Private (Admin only)
const resetCategoryPriceRanges = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Default price ranges for any category
    const defaultPriceRanges = [
      { name: 'under_5k', label: '₹0 - ₹5,000', min: 0, max: 5000, query: 'under 5000' },
      { name: 'under_10k', label: '₹5,000 - ₹10,000', min: 5000, max: 10000, query: 'under 10000' },
      { name: 'under_20k', label: '₹10,000 - ₹20,000', min: 10000, max: 20000, query: 'under 20000' },
      { name: 'under_30k', label: '₹20,000 - ₹30,000', min: 20000, max: 30000, query: 'under 30000' },
      { name: 'under_50k', label: '₹30,000 - ₹50,000', min: 30000, max: 50000, query: 'under 50000' },
      { name: 'above_50k', label: '₹50,000+', min: 50000, max: 100000, query: 'above 50000' }
    ];
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { 
        priceRanges: defaultPriceRanges,
        scrapingConfig: {
          maxProductsPerRange: 20,
          maxPages: 2,
          scrapingStatus: 'pending'
        }
      },
      { new: true, runValidators: true }
    ).select('name title priceRanges scrapingConfig');
    
    res.json({
      success: true,
      message: 'Price ranges reset to default successfully',
      data: {
        categoryId: updatedCategory._id,
        categoryName: updatedCategory.name,
        categoryTitle: updatedCategory.title,
        priceRanges: updatedCategory.priceRanges,
        scrapingConfig: updatedCategory.scrapingConfig
      }
    });
  } catch (error) {
    console.error('Reset Price Ranges Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting price ranges',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Seed electronics categories
// @route   POST /api/categories/seed-electronics
// @access  Private (Super Admin only)
const seedCategories = async (req, res) => {
  try {
    // Clear all existing categories
    const deleteResult = await Category.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing categories`);
    
    // Insert new electronics categories
    const insertedCategories = await Category.insertMany(electronicsCategories);
    
    res.json({
      success: true,
      message: `Successfully seeded ${insertedCategories.length} electronics categories`,
      data: {
        cleared: deleteResult.deletedCount,
        seeded: insertedCategories.length,
        categories: insertedCategories.map(cat => ({
          id: cat._id,
          name: cat.name,
          title: cat.title
        }))
      }
    });
  } catch (error) {
    console.error('Seed Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while seeding categories',
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
  toggleCategoryStatus,
  getCategoryPriceRanges,
  updateCategoryPriceRanges,
  resetCategoryPriceRanges,
  seedCategories
};
