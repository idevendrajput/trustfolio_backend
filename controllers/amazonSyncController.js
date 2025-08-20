const Category = require('../models/Category');
const Product = require('../models/Product');
const scrapingDogService = require('../services/scrapingDogService');

/**
 * Search products using ScrapingDog API
 */
const searchProducts = async (req, res) => {
  try {
    const { query, pincode = '110001', limit = 20 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const products = await scrapingDogService.searchProducts(query, pincode, limit);

    res.json({
      success: true,
      data: {
        query,
        pincode,
        totalResults: products.length,
        products
      }
    });

  } catch (error) {
    console.error('❌ Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
};

/**
 * Get detailed product information by ASIN
 */
const getProductDetails = async (req, res) => {
  try {
    const { asin } = req.body;

    if (!asin || asin.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid ASIN is required (10 characters)'
      });
    }

    const productDetails = await scrapingDogService.getProductDetails(asin);

    res.json({
      success: true,
      data: productDetails
    });

  } catch (error) {
    console.error('❌ Get product details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product details',
      error: error.message
    });
  }
};

/**
 * Get multiple product details by ASINs
 */
const getBulkProductDetails = async (req, res) => {
  try {
    const { asins } = req.body;

    if (!asins || !Array.isArray(asins) || asins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of ASINs is required'
      });
    }

    if (asins.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 ASINs allowed per request'
      });
    }

    const results = await scrapingDogService.getBulkProductDetails(asins);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Bulk product details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk product details',
      error: error.message
    });
  }
};

/**
 * Get category-specific search queries
 */
const getCategoryQueries = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    const queries = scrapingDogService.generateCategoryQueries(category);

    res.json({
      success: true,
      data: {
        category,
        queries
      }
    });

  } catch (error) {
    console.error('❌ Get category queries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate category queries',
      error: error.message
    });
  }
};

/**
 * Preview products for a category without saving
 */
const previewCategoryProducts = async (req, res) => {
  try {
    const { category, query, pincode = '110001', limit = 20 } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const results = await scrapingDogService.previewCategoryProducts(category, {
      query,
      pincode,
      limit
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Preview category products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview category products',
      error: error.message
    });
  }
};

/**
 * Sync products for a specific category
 */
const syncCategoryProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 50 } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!category.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Category is not active'
      });
    }

    // Update category sync status
    category.lastSyncStatus = 'in_progress';
    await category.save();

    console.log(`🔄 Starting sync for category: ${category.name}`);

    try {
      const results = await syncCategoryProductsToDatabase(category, limit);

      // Update category with sync results
      category.lastSyncAt = new Date();
      category.lastSyncStatus = 'completed';
      category.lastSyncResults = {
        success: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10) // Store first 10 errors only
      };
      await category.save();

      res.json({
        success: true,
        message: `Sync completed for ${category.name}`,
        data: results
      });

    } catch (syncError) {
      // Update category with failure status
      category.lastSyncAt = new Date();
      category.lastSyncStatus = 'failed';
      category.lastSyncResults = {
        error: syncError.message
      };
      await category.save();

      throw syncError;
    }

  } catch (error) {
    console.error('❌ Sync category products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync category products',
      error: error.message
    });
  }
};

/**
 * Sync all active categories
 */
const syncAllCategories = async (req, res) => {
  try {
    const { limit = 50 } = req.body;

    const categories = await Category.findActive();
    
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active categories found'
      });
    }

    const totalResults = {
      success: 0,
      failed: 0,
      errors: [],
      categoriesProcessed: 0
    };

    console.log(`🔄 Starting sync for ${categories.length} categories`);

    for (const category of categories) {
      try {
        console.log(`🔄 Syncing category: ${category.name}`);
        
        const results = await syncCategoryProductsToDatabase(category, limit);
        
        totalResults.success += results.success;
        totalResults.failed += results.failed;
        totalResults.errors.push(...results.errors);
        totalResults.categoriesProcessed++;

        // Update category
        category.lastSyncAt = new Date();
        category.lastSyncStatus = 'completed';
        category.lastSyncResults = {
          success: results.success,
          failed: results.failed,
          errors: results.errors.slice(0, 5)
        };
        await category.save();

        // Rate limiting between categories
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (categoryError) {
        console.error(`❌ Error syncing category ${category.name}:`, categoryError);
        
        totalResults.errors.push(`${category.name}: ${categoryError.message}`);
        
        // Update category with failure
        category.lastSyncAt = new Date();
        category.lastSyncStatus = 'failed';
        category.lastSyncResults = {
          error: categoryError.message
        };
        await category.save();
      }
    }

    res.json({
      success: true,
      message: `Bulk sync completed for ${totalResults.categoriesProcessed} categories`,
      data: totalResults
    });

  } catch (error) {
    console.error('❌ Sync all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync all categories',
      error: error.message
    });
  }
};

/**
 * Sync outdated products
 */
const syncOutdatedProducts = async (req, res) => {
  try {
    const { limit = 100 } = req.body;

    // Find products that need sync (older than 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    const outdatedProducts = await Product.find({
      isActive: true,
      $or: [
        { 'scrapingInfo.lastSyncAt': null },
        { 'scrapingInfo.lastSyncAt': { $lt: sixHoursAgo } }
      ]
    })
    .populate('category')
    .limit(limit);

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    console.log(`🔄 Updating ${outdatedProducts.length} outdated products`);

    for (const product of outdatedProducts) {
      try {
        const detailedData = await scrapingDogService.getProductDetails(product.asin);
        
        // Update product with fresh data
        const updatedData = scrapingDogService.parseProductDataEnhanced(
          detailedData, 
          product.category, 
          { query: 'refresh', pincode: '110001' }
        );

        if (updatedData) {
          // Update existing product with new data
          Object.assign(product, updatedData);
          await product.markSyncSuccessful();
          results.updated++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Error updating product ${product.asin}:`, error);
        await product.markSyncFailed(error.message);
        results.failed++;
        results.errors.push(`${product.asin}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Outdated products sync completed`,
      data: results
    });

  } catch (error) {
    console.error('❌ Sync outdated products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync outdated products',
      error: error.message
    });
  }
};

/**
 * Get sync status for all categories
 */
const getSyncStatus = async (req, res) => {
  try {
    const categories = await Category.find({})
      .select('name lastSyncAt lastSyncStatus lastSyncResults syncEnabled')
      .sort({ name: 1 });

    const stats = {
      totalCategories: categories.length,
      activeCategories: categories.filter(c => c.isActive).length,
      syncEnabledCategories: categories.filter(c => c.syncEnabled).length,
      recentlyCompletedSyncs: categories.filter(c => 
        c.lastSyncStatus === 'completed' && 
        c.lastSyncAt && 
        c.lastSyncAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      failedSyncs: categories.filter(c => c.lastSyncStatus === 'failed').length
    };

    res.json({
      success: true,
      data: {
        stats,
        categories: categories.map(cat => ({
          id: cat._id,
          name: cat.name,
          syncEnabled: cat.syncEnabled,
          lastSyncAt: cat.lastSyncAt,
          lastSyncStatus: cat.lastSyncStatus,
          lastSyncResults: cat.lastSyncResults
        }))
      }
    });

  } catch (error) {
    console.error('❌ Get sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
};

/**
 * Test API connectivity
 */
const testApi = async (req, res) => {
  try {
    const testResults = await scrapingDogService.searchProducts('smartphone', '110001', 5);
    
    res.json({
      success: true,
      message: 'API connectivity test successful',
      data: {
        sampleResultsCount: testResults.length,
        apiResponsive: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ API test error:', error);
    res.status(500).json({
      success: false,
      message: 'API connectivity test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Helper function to sync category products to database
 */
async function syncCategoryProductsToDatabase(category, maxProducts = 50) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get search queries for this category
    const searchQueries = category.searchQueries && category.searchQueries.length > 0
      ? category.searchQueries
      : scrapingDogService.generateCategoryQueries(category.name).slice(0, 5);
    
    const pincodes = ['110001', '400001', '560001', '700001']; // Major cities
    
    for (const query of searchQueries) {
      for (const pincode of pincodes) {
        try {
          const products = await scrapingDogService.searchProducts(query, pincode);
          
          for (const productData of products) {
            if (results.success >= maxProducts) {
              break;
            }
            
            try {
              const parsedProduct = scrapingDogService.parseProductDataEnhanced(
                productData, 
                category, 
                { query, pincode }
              );
              
              if (parsedProduct) {
                // Save or update product in database
                const existingProduct = await Product.findOne({ asin: parsedProduct.asin });
                
                if (existingProduct) {
                  // Update existing product
                  Object.assign(existingProduct, parsedProduct);
                  await existingProduct.save();
                } else {
                  // Create new product
                  const newProduct = new Product(parsedProduct);
                  await newProduct.save();
                }
                
                results.success++;
              }
              
              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 200));
              
            } catch (error) {
              results.failed++;
              results.errors.push(`Product save error: ${error.message}`);
            }
          }
          
          if (results.success >= maxProducts) {
            break;
          }
          
          // Rate limiting between searches
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.errors.push(`Search error for "${query}" in ${pincode}: ${error.message}`);
        }
      }
      
      if (results.success >= maxProducts) {
        break;
      }
    }
    
  } catch (error) {
    results.errors.push(`Category sync error: ${error.message}`);
  }

  return results;
}

module.exports = {
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
};
