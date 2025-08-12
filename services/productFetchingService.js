const Category = require('../models/Category');
const Product = require('../models/Product');
const oxylabsService = require('./oxylabsService');

/**
 * Service to fetch products from Oxylabs for all categories and budget ranges
 */
class ProductFetchingService {
  constructor() {
    // Define budget ranges for product searching
    this.budgetRanges = [
      { name: 'Under 5K', min: 0, max: 5000 },
      { name: '5K-10K', min: 5000, max: 10000 },
      { name: '10K-25K', min: 10000, max: 25000 },
      { name: '25K-50K', min: 25000, max: 50000 },
      { name: '50K-1L', min: 50000, max: 100000 },
      { name: 'Above 1L', min: 100000, max: 500000 }
    ];
  }

  /**
   * Fetch products for all categories and all budget ranges
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Results summary
   */
  async fetchAllProducts(options = {}) {
    const {
      productsPerRange = 20,
      skipExisting = true,
      maxConcurrent = 2
    } = options;

    console.log('🚀 Starting bulk product fetching...');
    
    try {
      // Get all active categories
      const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
      console.log(`📂 Found ${categories.length} active categories`);

      if (categories.length === 0) {
        throw new Error('No active categories found');
      }

      const results = {
        totalCategories: categories.length,
        totalRanges: this.budgetRanges.length,
        processed: 0,
        successful: 0,
        failed: 0,
        productsAdded: 0,
        productsSkipped: 0,
        errors: [],
        summary: []
      };

      // Process categories in batches to avoid overwhelming the API
      for (let i = 0; i < categories.length; i += maxConcurrent) {
        const batch = categories.slice(i, i + maxConcurrent);
        
        await Promise.all(batch.map(async (category) => {
          const categoryResult = await this.fetchProductsForCategory(
            category, 
            productsPerRange, 
            skipExisting
          );
          
          results.processed++;
          results.productsAdded += categoryResult.added;
          results.productsSkipped += categoryResult.skipped;
          
          if (categoryResult.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(categoryResult.error);
          }
          
          results.summary.push({
            category: category.name,
            ...categoryResult
          });
          
          console.log(`✅ Completed ${category.name}: ${categoryResult.added} added, ${categoryResult.skipped} skipped`);
        }));
        
        // Add delay between batches
        if (i + maxConcurrent < categories.length) {
          console.log('⏳ Waiting before next batch...');
          await this.sleep(5000); // 5 second delay
        }
      }

      console.log('🎉 Bulk product fetching completed!');
      console.log(`📊 Summary: ${results.productsAdded} products added, ${results.productsSkipped} skipped`);
      
      return results;
    } catch (error) {
      console.error('❌ Error in bulk product fetching:', error.message);
      throw error;
    }
  }

  /**
   * Fetch products for a single category across all budget ranges
   * @param {Object} category - Category document
   * @param {number} productsPerRange - Products to fetch per budget range
   * @param {boolean} skipExisting - Skip if products already exist
   * @returns {Promise<Object>} - Category processing result
   */
  async fetchProductsForCategory(category, productsPerRange = 20, skipExisting = true) {
    console.log(`🔍 Processing category: ${category.name}`);
    
    const result = {
      success: true,
      added: 0,
      skipped: 0,
      error: null,
      ranges: []
    };

    try {
      for (const range of this.budgetRanges) {
        const rangeResult = await this.fetchProductsForRange(
          category, 
          range, 
          productsPerRange, 
          skipExisting
        );
        
        result.added += rangeResult.added;
        result.skipped += rangeResult.skipped;
        result.ranges.push(rangeResult);
        
        // Small delay between ranges
        await this.sleep(2000);
      }
    } catch (error) {
      console.error(`❌ Error processing category ${category.name}:`, error.message);
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Fetch products for a specific category and budget range
   * @param {Object} category - Category document
   * @param {Object} range - Budget range object
   * @param {number} limit - Number of products to fetch
   * @param {boolean} skipExisting - Skip if products already exist
   * @returns {Promise<Object>} - Range processing result
   */
  async fetchProductsForRange(category, range, limit = 20, skipExisting = true) {
    console.log(`💰 Fetching ${category.name} products for ${range.name} (₹${range.min}-₹${range.max})`);
    
    const result = {
      range: range.name,
      added: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Check if we should skip existing products
      if (skipExisting) {
        const existingCount = await Product.countDocuments({
          category: category._id,
          'pricing.current': { $gte: range.min, $lte: range.max },
          isActive: true
        });
        
        if (existingCount >= limit) {
          console.log(`⏭️  Skipping ${category.name} ${range.name} - ${existingCount} products already exist`);
          result.skipped = existingCount;
          return result;
        }
      }

      // Prepare search keywords
      const searchKeywords = category.searchKeywords || [];
      
      // Fetch products from Oxylabs
      const rawProducts = await oxylabsService.searchProducts(
        category.name,
        range.max,
        searchKeywords,
        limit * 2 // Fetch more to account for filtering
      );

      if (rawProducts.length === 0) {
        console.log(`⚠️  No products found for ${category.name} ${range.name}`);
        return result;
      }

      console.log(`📦 Processing ${rawProducts.length} raw products for ${category.name} ${range.name}`);

      // Process and save products
      for (let i = 0; i < rawProducts.length && result.added < limit; i++) {
        try {
          const productData = oxylabsService.parseProductData(
            rawProducts[i],
            category,
            {
              query: `${category.name} under ${range.max}`,
              priceRange: range,
              position: i + 1
            }
          );

          if (!productData) {
            console.log(`⚠️  Skipped product ${i + 1}: Failed to parse data`);
            continue;
          }

          // Filter by price range
          if (productData.pricing.current < range.min || productData.pricing.current > range.max) {
            console.log(`⚠️  Skipped product: Price ₹${productData.pricing.current} outside range ${range.name}`);
            continue;
          }

          // Set price range for the product
          productData.pricing.priceRange = range.name;

          // Check if product already exists
          const existingProduct = await Product.findOne({ asin: productData.asin });
          
          if (existingProduct) {
            console.log(`⚠️  Skipped existing product: ${productData.asin}`);
            result.skipped++;
            continue;
          }

          // Save the product
          const newProduct = new Product(productData);
          const validationErrors = newProduct.validateProductData();
          
          if (validationErrors.length > 0) {
            console.log(`⚠️  Skipped invalid product: ${validationErrors.join(', ')}`);
            result.errors.push(`Validation failed: ${validationErrors.join(', ')}`);
            continue;
          }

          await newProduct.save();
          result.added++;
          
          console.log(`✅ Added product: ${productData.title.substring(0, 50)}... (₹${productData.pricing.current})`);
          
        } catch (error) {
          console.error(`❌ Error processing product ${i + 1}:`, error.message);
          result.errors.push(`Product ${i + 1}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error fetching products for ${category.name} ${range.name}:`, error.message);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Fetch products for a specific category (all ranges)
   * @param {string} categoryId - Category ID
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Results summary
   */
  async fetchProductsForCategoryById(categoryId, options = {}) {
    const { productsPerRange = 20, skipExisting = true } = options;
    
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
      
      if (!category.isActive) {
        throw new Error('Category is not active');
      }

      return await this.fetchProductsForCategory(category, productsPerRange, skipExisting);
    } catch (error) {
      console.error(`❌ Error fetching products for category ${categoryId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get products statistics
   * @returns {Promise<Object>} - Statistics
   */
  async getProductsStats() {
    try {
      const totalProducts = await Product.countDocuments({ isActive: true });
      
      const categoriesStats = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$categoryName',
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricing.current' },
            minPrice: { $min: '$pricing.current' },
            maxPrice: { $max: '$pricing.current' },
            avgRating: { $avg: '$rating.average' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      const priceRangeStats = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$pricing.priceRange',
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricing.current' },
            avgRating: { $avg: '$rating.average' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const qualityStats = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$quality',
            count: { $sum: 1 }
          }
        }
      ]);

      const recentlyAdded = await Product.find(
        { isActive: true }, 
        'title pricing.current rating.average scrapingInfo.scrapedAt'
      )
      .sort({ 'scrapingInfo.scrapedAt': -1 })
      .limit(10)
      .populate('category', 'name title');

      return {
        totalProducts,
        categoriesStats,
        priceRangeStats,
        qualityStats,
        recentlyAdded
      };
    } catch (error) {
      console.error('❌ Error getting product stats:', error.message);
      throw error;
    }
  }

  /**
   * Clean old or invalid products
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} - Cleanup results
   */
  async cleanupProducts(options = {}) {
    const {
      removeOlderThanDays = 30,
      removeInvalidProducts = true,
      removeDuplicates = true
    } = options;

    const results = {
      oldProductsRemoved: 0,
      invalidProductsRemoved: 0,
      duplicatesRemoved: 0
    };

    try {
      // Remove old products
      if (removeOlderThanDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - removeOlderThanDays);
        
        const oldProductsResult = await Product.deleteMany({
          'scrapingInfo.scrapedAt': { $lt: cutoffDate },
          isActive: true
        });
        
        results.oldProductsRemoved = oldProductsResult.deletedCount;
        console.log(`🗑️  Removed ${results.oldProductsRemoved} old products`);
      }

      // Remove invalid products
      if (removeInvalidProducts) {
        const invalidProductsResult = await Product.deleteMany({
          $or: [
            { 'pricing.current': { $lte: 0 } },
            { title: { $exists: false } },
            { asin: { $exists: false } },
            { images: { $size: 0 } }
          ]
        });
        
        results.invalidProductsRemoved = invalidProductsResult.deletedCount;
        console.log(`🗑️  Removed ${results.invalidProductsRemoved} invalid products`);
      }

      // Remove duplicates (keep the most recent one)
      if (removeDuplicates) {
        const duplicates = await Product.aggregate([
          {
            $group: {
              _id: '$asin',
              ids: { $push: '$_id' },
              count: { $sum: 1 }
            }
          },
          { $match: { count: { $gt: 1 } } }
        ]);

        for (const duplicate of duplicates) {
          // Keep the first one, remove the rest
          const idsToRemove = duplicate.ids.slice(1);
          await Product.deleteMany({ _id: { $in: idsToRemove } });
          results.duplicatesRemoved += idsToRemove.length;
        }
        
        console.log(`🗑️  Removed ${results.duplicatesRemoved} duplicate products`);
      }

      return results;
    } catch (error) {
      console.error('❌ Error cleaning up products:', error.message);
      throw error;
    }
  }

  /**
   * Helper method to sleep/delay
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ProductFetchingService();
