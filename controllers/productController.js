const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public/Private
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      category, 
      priceRange,
      minPrice,
      maxPrice,
      minRating,
      brand,
      availability,
      sortBy = 'created_at',
      sortOrder = 'desc',
      isAdmin = false
    } = req.query;

    // Build query object
    let query = {};
    
    // Admin can see all products, public can only see active ones
    if (!isAdmin) {
      query.isActive = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { 'description.short': { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      query.categoryName = category;
    }

    // Price range filter
    if (priceRange) {
      query['pricing.priceRange'] = priceRange;
    }

    // Price range with min/max
    if (minPrice || maxPrice) {
      query['pricing.current'] = {};
      if (minPrice) query['pricing.current'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.current'].$lte = Number(maxPrice);
    }

    // Rating filter
    if (minRating) {
      query['rating.average'] = { $gte: Number(minRating) };
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Availability filter
    if (availability) {
      query['availability.status'] = availability;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sortObj = {};
    if (sortBy === 'price') {
      sortObj['pricing.current'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
      sortObj['rating.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'reviews') {
      sortObj['rating.totalReviews'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Get products with pagination
    const products = await Product.find(query)
      .populate('category', 'name title')
      .sort(sortObj)
      .limit(limit * 1)
      .skip(skip)
      .select(isAdmin ? '' : '-scrapingInfo -__v') // Hide scraping info from public
      .exec();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Get additional stats for admin
    let stats = {};
    if (isAdmin) {
      const [
        totalProducts,
        activeProducts,
        recentProducts,
        categoryCounts
      ] = await Promise.all([
        Product.countDocuments({}),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({
          'scrapingInfo.scrapedAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        Product.aggregate([
          { $group: { _id: '$categoryName', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      stats = {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts,
        recent24h: recentProducts,
        byCategory: categoryCounts
      };
    }

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
      },
      ...(isAdmin && { stats })
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
    
    // Find by MongoDB ID or ASIN
    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId
      product = await Product.findById(id).populate('category', 'name title');
    } else {
      // ASIN
      product = await Product.findOne({ asin: id.toUpperCase() }).populate('category', 'name title');
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

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name title');
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete product
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: { deleted_product: { id: product._id, asin: product.asin, title: product.title } }
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Bulk delete products
// @route   POST /api/products/bulk-delete
// @access  Private (Admin only)
const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds, filters } = req.body;
    
    let deleteQuery = {};
    
    if (productIds && productIds.length > 0) {
      // Delete specific products
      deleteQuery._id = { $in: productIds };
    } else if (filters) {
      // Delete by filters
      if (filters.category) deleteQuery.categoryName = filters.category;
      if (filters.priceRange) deleteQuery['pricing.priceRange'] = filters.priceRange;
      if (filters.olderThan) {
        deleteQuery['scrapingInfo.scrapedAt'] = { $lt: new Date(filters.olderThan) };
      }
    }
    
    if (Object.keys(deleteQuery).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No deletion criteria provided'
      });
    }
    
    const result = await Product.deleteMany(deleteQuery);
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk Delete Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting products',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Clean old products (24 hour cycle)
// @route   POST /api/products/clean-old
// @access  Private (Admin only)
const cleanOldProducts = async (req, res) => {
  try {
    const { categoryName, priceRange, hoursOld = 24 } = req.body;
    
    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    
    // Build query for old products
    let query = {
      'scrapingInfo.scrapedAt': { $lt: cutoffTime }
    };
    
    if (categoryName) {
      query.categoryName = categoryName;
    }
    
    if (priceRange) {
      query['pricing.priceRange'] = priceRange;
    }
    
    // Get count before deletion
    const countToDelete = await Product.countDocuments(query);
    
    // Delete old products
    const result = await Product.deleteMany(query);
    
    res.json({
      success: true,
      message: `Cleaned ${result.deletedCount} old products (older than ${hoursOld} hours)`,
      deletedCount: result.deletedCount,
      criteria: {
        categoryName: categoryName || 'all',
        priceRange: priceRange || 'all',
        hoursOld
      }
    });
  } catch (error) {
    console.error('Clean Old Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning old products',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private (Admin only)
const getProductStats = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      recentProducts,
      categoryStats,
      priceRangeStats,
      qualityStats,
      brandStats
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({
        'scrapingInfo.scrapedAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Product.aggregate([
        { $group: { _id: '$categoryName', count: { $sum: 1 }, avgPrice: { $avg: '$pricing.current' } } },
        { $sort: { count: -1 } }
      ]),
      Product.aggregate([
        { $group: { _id: '$pricing.priceRange', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Product.aggregate([
        { $group: { _id: '$quality', count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const stats = {
      overview: {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts,
        recent24h: recentProducts
      },
      byCategory: categoryStats,
      byPriceRange: priceRangeStats,
      byQuality: qualityStats,
      topBrands: brandStats,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get Product Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product statistics',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  cleanOldProducts,
  getProductStats
};
