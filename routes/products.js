const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const productFetchingService = require('../services/productFetchingService');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all product routes
router.use(authenticate);

/**
 * GET /api/products - Get all products with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      priceMin,
      priceMax,
      priceRange,
      rating,
      brand,
      search,
      quality,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { isActive: true };

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        filter.categoryName = new RegExp(category, 'i');
      }
    }

    if (priceMin || priceMax) {
      filter['pricing.current'] = {};
      if (priceMin) filter['pricing.current'].$gte = parseFloat(priceMin);
      if (priceMax) filter['pricing.current'].$lte = parseFloat(priceMax);
    }

    if (priceRange) {
      filter['pricing.priceRange'] = priceRange;
    }

    if (rating) {
      filter['rating.average'] = { $gte: parseFloat(rating) };
    }

    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }

    if (quality) {
      filter.quality = quality;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    if (search) {
      sort.score = { $meta: 'textScore' };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(filter)
      .populate('category', 'name title')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

/**
 * GET /api/products/stats - Get products statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await productFetchingService.getProductsStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/products/:id - Get single product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name title description');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

/**
 * POST /api/products/fetch-all - Fetch products for all categories
 * Requires admin role
 */
router.post('/fetch-all', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      productsPerRange = 20,
      skipExisting = true,
      maxConcurrent = 2
    } = req.body;

    console.log(`🚀 Admin ${req.admin.email} started bulk product fetching`);

    // Start the fetching process (don't await as it might take long)
    const fetchingPromise = productFetchingService.fetchAllProducts({
      productsPerRange: parseInt(productsPerRange),
      skipExisting: skipExisting === true,
      maxConcurrent: parseInt(maxConcurrent)
    });

    // Return immediate response
    res.json({
      success: true,
      message: 'Product fetching started successfully',
      data: {
        estimatedTime: '15-30 minutes',
        productsPerRange: parseInt(productsPerRange),
        skipExisting: skipExisting === true,
        maxConcurrent: parseInt(maxConcurrent)
      }
    });

    // Log the results when done (background process)
    fetchingPromise
      .then(results => {
        console.log('✅ Bulk product fetching completed:', results);
      })
      .catch(error => {
        console.error('❌ Bulk product fetching failed:', error);
      });

  } catch (error) {
    console.error('Error starting product fetch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start product fetching',
      error: error.message
    });
  }
});

/**
 * POST /api/products/fetch-category/:categoryId - Fetch products for specific category
 * Requires admin role
 */
router.post('/fetch-category/:categoryId', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      productsPerRange = 20,
      skipExisting = true
    } = req.body;

    console.log(`🔍 Admin ${req.admin.email} fetching products for category ${categoryId}`);

    const result = await productFetchingService.fetchProductsForCategoryById(categoryId, {
      productsPerRange: parseInt(productsPerRange),
      skipExisting: skipExisting === true
    });

    res.json({
      success: true,
      message: 'Product fetching completed',
      data: result
    });
  } catch (error) {
    console.error('Error fetching products for category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products for category',
      error: error.message
    });
  }
});

/**
 * GET /api/products/category/:categoryId - Get products by category
 */
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 20,
      priceMin,
      priceMax,
      priceRange,
      rating,
      brand,
      quality,
      sortBy = 'rating.average',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { 
      category: categoryId,
      isActive: true 
    };

    if (priceMin || priceMax) {
      filter['pricing.current'] = {};
      if (priceMin) filter['pricing.current'].$gte = parseFloat(priceMin);
      if (priceMax) filter['pricing.current'].$lte = parseFloat(priceMax);
    }

    if (priceRange) {
      filter['pricing.priceRange'] = priceRange;
    }

    if (rating) {
      filter['rating.average'] = { $gte: parseFloat(rating) };
    }

    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }

    if (quality) {
      filter.quality = quality;
    }

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(filter)
      .populate('category', 'name title')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    // Get category info
    const category = await Category.findById(categoryId);

    res.json({
      success: true,
      data: {
        category,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category',
      error: error.message
    });
  }
});

module.exports = router;
