const Product = require('../models/Product');
const Category = require('../models/Category');
const productScrapingService = require('../services/productScrapingService');

// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      brand,
      rating,
      sort = '-rating.average',
      search
    } = req.query;

    // Build query object
    let query = { isActive: true };

    // Category filter
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        query.categoryName = new RegExp(category, 'i');
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.current'] = {};
      if (minPrice) query['pricing.current'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.current'].$lte = parseFloat(maxPrice);
    }

    // Brand filter
    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    // Rating filter
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name slug title')
      .sort(sort)
      .limit(limit * 1)
      .skip(skip)
      .select('asin title brand pricing rating primaryImage availability categoryName')
      .exec();

    // Get total count
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
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
    console.error('Get Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Get single product by ID or ASIN
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    // Check if it's ASIN (10 characters) or ObjectId (24 characters)
    if (id.length === 10) {
      product = await Product.findOne({ asin: id.toUpperCase() })
        .populate('category', 'name slug title description');
    } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id)
        .populate('category', 'name slug title description');
    }

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
    console.error('Get Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      sort = '-rating.average',
      quality
    } = req.query;

    // Find category
    let category;
    if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(categoryId);
    } else {
      category = await Category.findOne({ slug: categoryId });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build query
    let query = {
      category: category._id,
      isActive: true
    };

    // Price filters
    if (minPrice || maxPrice) {
      query['pricing.current'] = {};
      if (minPrice) query['pricing.current'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.current'].$lte = parseFloat(maxPrice);
    }

    // Quality filter
    if (quality && ['high', 'medium', 'low'].includes(quality)) {
      query.quality = quality;
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip(skip)
      .select('asin title brand pricing rating primaryImage availability quality')
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        title: category.title
      },
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
    console.error('Get Products by Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const {
      q: searchQuery,
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sort = '-rating.average'
    } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Build search query
    let query = {
      $text: { $search: searchQuery },
      isActive: true
    };

    // Additional filters
    if (category) {
      query.categoryName = new RegExp(category, 'i');
    }

    if (minPrice || maxPrice) {
      query['pricing.current'] = {};
      if (minPrice) query['pricing.current'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.current'].$lte = parseFloat(maxPrice);
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ score: { $meta: 'textScore' }, ...this.parseSortQuery(sort) })
      .limit(limit * 1)
      .skip(skip)
      .select('asin title brand pricing rating primaryImage categoryName')
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      searchQuery,
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
    console.error('Search Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching products',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Start product scraping
// @route   POST /api/products/scraping/start
// @access  Private (Admin only)
const startScraping = async (req, res) => {
  try {
    const options = req.body || {};
    
    const result = await productScrapingService.startScraping(options);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Scraping started successfully',
        data: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Start Scraping Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start scraping',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Scrape specific category
// @route   POST /api/products/scraping/category/:categoryId
// @access  Private (Admin only)
const scrapeCategoryProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const options = req.body || {};
    
    const result = await productScrapingService.scrapeCategoryById(categoryId, options);
    
    res.json({
      success: result.success,
      message: result.success ? 'Category scraping completed' : 'Category scraping failed',
      data: result
    });

  } catch (error) {
    console.error('Scrape Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scrape category',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Get scraping status
// @route   GET /api/products/scraping/status
// @access  Private (Admin only)
const getScrapingStatus = async (req, res) => {
  try {
    const status = productScrapingService.getStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get Scraping Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scraping status',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Stop scraping
// @route   POST /api/products/scraping/stop
// @access  Private (Admin only)
const stopScraping = async (req, res) => {
  try {
    const result = await productScrapingService.stopScraping();
    
    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Stop Scraping Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop scraping',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private (Admin only)
const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          averagePrice: { $avg: '$pricing.current' },
          averageRating: { $avg: '$rating.average' },
          totalCategories: { $addToSet: '$categoryName' }
        }
      },
      {
        $project: {
          _id: 0,
          totalProducts: 1,
          activeProducts: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          averageRating: { $round: ['$averageRating', 2] },
          totalCategories: { $size: '$totalCategories' }
        }
      }
    ]);

    // Get category-wise stats
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$categoryName',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.current' },
          avgRating: { $avg: '$rating.average' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        topCategories: categoryStats
      }
    });

  } catch (error) {
    console.error('Get Product Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product statistics',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// Helper function to parse sort query
const parseSortQuery = (sortString) => {
  const sortObj = {};
  sortString.split(',').forEach(field => {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });
  return sortObj;
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  startScraping,
  scrapeCategoryProducts,
  getScrapingStatus,
  stopScraping,
  getProductStats
};
