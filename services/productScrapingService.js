const Category = require('../models/Category');
const Product = require('../models/Product');
const oxylabsService = require('./oxylabsService');

class ProductScrapingService {
  constructor() {
    this.isRunning = false;
    this.scrapingQueue = [];
    this.stats = {
      totalProcessed: 0,
      totalSaved: 0,
      totalErrors: 0,
      startTime: null
    };
  }

  /**
   * Start scraping process for all active categories
   * @param {Object} options - Scraping options
   */
  async startScraping(options = {}) {
    if (this.isRunning) {
      console.log('⚠️  Scraping is already running');
      return { success: false, message: 'Scraping already in progress' };
    }

    try {
      console.log('🚀 Starting Amazon product scraping...');
      this.isRunning = true;
      this.stats = {
        totalProcessed: 0,
        totalSaved: 0,
        totalErrors: 0,
        startTime: new Date()
      };

      // Get all active categories
      const categories = await Category.find({ 
        isActive: true,
        scrapingStatus: { $ne: 'in_progress' }
      }).sort({ sortOrder: 1 });

      console.log(`📊 Found ${categories.length} categories to process`);

      // Process categories sequentially to avoid overwhelming the API
      for (const category of categories) {
        await this.processCategoryWithRateLimit(category, options);
        
        // Add delay between categories
        await this.delay(2000);
      }

      const duration = (new Date() - this.stats.startTime) / 1000;
      console.log(`✅ Scraping completed in ${duration}s`);
      console.log(`📈 Stats: ${this.stats.totalSaved} saved, ${this.stats.totalErrors} errors`);

      return {
        success: true,
        message: 'Scraping completed successfully',
        stats: this.stats
      };

    } catch (error) {
      console.error('❌ Scraping process failed:', error);
      return {
        success: false,
        message: 'Scraping process failed',
        error: error.message
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single category with all its price ranges
   * @param {Object} category - Category document
   * @param {Object} options - Processing options
   */
  async processCategoryWithRateLimit(category, options = {}) {
    try {
      console.log(`\n🔄 Processing category: ${category.name}`);
      
      // Update category status
      await Category.findByIdAndUpdate(category._id, {
        scrapingStatus: 'in_progress'
      });

      // Generate price ranges based on category configuration
      const priceRanges = this.generatePriceRanges(
        category.priceRange.min,
        category.priceRange.max,
        category.priceRange.step
      );

      console.log(`💰 Generated ${priceRanges.length} price ranges for ${category.name}`);

      let categoryStats = {
        processed: 0,
        saved: 0,
        errors: 0
      };

      // Process each price range
      for (const [index, range] of priceRanges.entries()) {
        try {
          console.log(`\n💸 Processing range ${index + 1}/${priceRanges.length}: ₹${range.min} - ₹${range.max}`);
          
          const rangeStats = await this.processProductsInPriceRange(category, range, options);
          
          categoryStats.processed += rangeStats.processed;
          categoryStats.saved += rangeStats.saved;
          categoryStats.errors += rangeStats.errors;

          // Rate limiting: wait between ranges
          if (index < priceRanges.length - 1) {
            await this.delay(3000); // 3 second delay between price ranges
          }

        } catch (error) {
          console.error(`❌ Error processing range ₹${range.min}-₹${range.max}:`, error.message);
          categoryStats.errors++;
        }
      }

      // Update category completion status
      await Category.findByIdAndUpdate(category._id, {
        scrapingStatus: 'completed',
        lastScraped: new Date()
      });

      this.stats.totalProcessed += categoryStats.processed;
      this.stats.totalSaved += categoryStats.saved;
      this.stats.totalErrors += categoryStats.errors;

      console.log(`✅ Completed ${category.name}: ${categoryStats.saved} products saved`);

    } catch (error) {
      console.error(`❌ Failed to process category ${category.name}:`, error.message);
      
      await Category.findByIdAndUpdate(category._id, {
        scrapingStatus: 'failed'
      });
    }
  }

  /**
   * Process products within a specific price range
   * @param {Object} category - Category document
   * @param {Object} range - Price range {min, max}
   * @param {Object} options - Processing options
   */
  async processProductsInPriceRange(category, range, options = {}) {
    const stats = { processed: 0, saved: 0, errors: 0 };
    const limit = options.limit || 20;

    try {
      // Search for products in this price range
      const rawProducts = await oxylabsService.searchProducts(
        category.name,
        range.max,
        category.searchKeywords || [],
        limit
      );

      console.log(`🔍 Found ${rawProducts.length} products in range ₹${range.min}-₹${range.max}`);

      // Process each product
      for (const [position, rawProduct] of rawProducts.entries()) {
        try {
          stats.processed++;

          const searchInfo = {
            query: category.name,
            priceRange: range,
            position: position + 1
          };

          // Parse product data
          const productData = oxylabsService.parseProductData(rawProduct, category, searchInfo);
          
          if (!productData) {
            console.warn('⚠️  Skipping product due to missing critical data');
            continue;
          }

          // Filter by price range
          if (productData.pricing.current < range.min || productData.pricing.current > range.max) {
            console.log(`💰 Price ₹${productData.pricing.current} outside range ₹${range.min}-₹${range.max}, skipping`);
            continue;
          }

          // Save or update product
          const saved = await this.saveProduct(productData);
          if (saved) {
            stats.saved++;
            console.log(`💾 Saved: ${productData.title.substring(0, 50)}... (₹${productData.pricing.current})`);
          }

          // Small delay between products
          await this.delay(500);

        } catch (error) {
          console.error('❌ Error processing individual product:', error.message);
          stats.errors++;
        }
      }

    } catch (error) {
      console.error(`❌ Failed to process price range ₹${range.min}-₹${range.max}:`, error.message);
      stats.errors++;
    }

    return stats;
  }

  /**
   * Save or update product in database
   * @param {Object} productData - Structured product data
   * @returns {boolean} - Success status
   */
  async saveProduct(productData) {
    try {
      // Check if product already exists
      const existingProduct = await Product.findOne({ asin: productData.asin });

      if (existingProduct) {
        // Update existing product
        const updatedProduct = await Product.findOneAndUpdate(
          { asin: productData.asin },
          {
            ...productData,
            'scrapingInfo.scrapedAt': new Date()
          },
          { new: true, runValidators: true }
        );

        return !!updatedProduct;
      } else {
        // Create new product
        const newProduct = new Product(productData);
        
        // Validate product data
        const validationErrors = newProduct.validateProductData();
        if (validationErrors.length > 0) {
          console.warn(`⚠️  Product validation failed: ${validationErrors.join(', ')}`);
          return false;
        }

        await newProduct.save();
        return true;
      }

    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - product already exists
        console.log(`ℹ️  Product with ASIN ${productData.asin} already exists`);
        return false;
      }
      
      console.error('❌ Error saving product:', error.message);
      return false;
    }
  }

  /**
   * Generate price ranges for a category
   * @param {number} min - Minimum price
   * @param {number} max - Maximum price  
   * @param {number} step - Step size
   * @returns {Array} - Array of price range objects
   */
  generatePriceRanges(min, max, step) {
    const ranges = [];
    
    for (let i = min; i <= max; i += step) {
      ranges.push({
        min: i,
        max: Math.min(i + step - 1, max)
      });
    }

    return ranges;
  }

  /**
   * Scrape products for a specific category
   * @param {string} categoryId - Category ID
   * @param {Object} options - Scraping options
   */
  async scrapeCategoryById(categoryId, options = {}) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      console.log(`🎯 Starting targeted scraping for: ${category.name}`);
      
      this.stats = {
        totalProcessed: 0,
        totalSaved: 0,
        totalErrors: 0,
        startTime: new Date()
      };

      await this.processCategoryWithRateLimit(category, options);

      return {
        success: true,
        category: category.name,
        stats: this.stats
      };

    } catch (error) {
      console.error(`❌ Failed to scrape category ${categoryId}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get scraping status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      queueSize: this.scrapingQueue.length
    };
  }

  /**
   * Stop scraping process
   */
  async stopScraping() {
    console.log('🛑 Stopping scraping process...');
    this.isRunning = false;
    
    // Reset any in_progress categories
    await Category.updateMany(
      { scrapingStatus: 'in_progress' },
      { scrapingStatus: 'pending' }
    );

    return { success: true, message: 'Scraping stopped' };
  }

  /**
   * Utility: Add delay
   * @param {number} ms - Milliseconds to wait
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean old products (remove products older than specified days)
   * @param {number} days - Days threshold
   */
  async cleanOldProducts(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Product.deleteMany({
        'scrapingInfo.scrapedAt': { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned ${result.deletedCount} old products`);
      return result.deletedCount;

    } catch (error) {
      console.error('❌ Error cleaning old products:', error.message);
      throw error;
    }
  }
}

module.exports = new ProductScrapingService();
