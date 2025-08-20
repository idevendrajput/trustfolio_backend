const cron = require('node-cron');
const Category = require('../models/Category');
const Product = require('../models/Product');
const scrapingDogService = require('../services/scrapingDogService');

class AmazonSyncJobs {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize all scheduled jobs
   */
  init() {
    console.log('🚀 Initializing Amazon sync jobs...');
    
    // Sync outdated products every 4 hours
    this.scheduleOutdatedProductsSync();
    
    // Check for categories needing sync every hour
    this.scheduleCategorySync();
    
    // Daily cleanup operations
    this.scheduleDailyCleanup();
    
    // Weekly deep maintenance
    this.scheduleWeeklyMaintenance();

    this.isRunning = true;
    console.log('✅ Amazon sync jobs initialized successfully');
  }

  /**
   * Schedule outdated products sync - every 4 hours
   */
  scheduleOutdatedProductsSync() {
    const job = cron.schedule('0 */4 * * *', async () => {
      try {
        console.log('🔄 Starting scheduled outdated products sync...');
        await this.syncOutdatedProducts(50);
        console.log('✅ Scheduled outdated products sync completed');
      } catch (error) {
        console.error('❌ Scheduled outdated products sync failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.set('outdated-products-sync', job);
    console.log('📅 Scheduled: Outdated products sync every 4 hours');
  }

  /**
   * Schedule category sync checks - every hour
   */
  scheduleCategorySync() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        console.log('🔍 Checking for categories needing sync...');
        await this.checkAndSyncCategories();
      } catch (error) {
        console.error('❌ Category sync check failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.set('category-sync-check', job);
    console.log('📅 Scheduled: Category sync check every hour');
  }

  /**
   * Schedule daily cleanup - every day at 2 AM
   */
  scheduleDailyCleanup() {
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🧹 Starting daily cleanup...');
        await this.performDailyCleanup();
        console.log('✅ Daily cleanup completed');
      } catch (error) {
        console.error('❌ Daily cleanup failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.set('daily-cleanup', job);
    console.log('📅 Scheduled: Daily cleanup at 2 AM');
  }

  /**
   * Schedule weekly maintenance - every Sunday at 3 AM
   */
  scheduleWeeklyMaintenance() {
    const job = cron.schedule('0 3 * * 0', async () => {
      try {
        console.log('🔧 Starting weekly maintenance...');
        await this.performWeeklyMaintenance();
        console.log('✅ Weekly maintenance completed');
      } catch (error) {
        console.error('❌ Weekly maintenance failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.set('weekly-maintenance', job);
    console.log('📅 Scheduled: Weekly maintenance on Sundays at 3 AM');
  }

  /**
   * Sync outdated products
   */
  async syncOutdatedProducts(limit = 50) {
    try {
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
            { query: 'scheduled-refresh', pincode: '110001' }
          );

          if (updatedData) {
            Object.assign(product, updatedData);
            await product.markSyncSuccessful();
            results.updated++;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Error updating product ${product.asin}:`, error);
          await product.markSyncFailed(error.message);
          results.failed++;
          results.errors.push(`${product.asin}: ${error.message}`);
        }
      }

      console.log(`✅ Outdated products sync: ${results.updated} updated, ${results.failed} failed`);
      return results;

    } catch (error) {
      console.error('❌ Sync outdated products error:', error);
      throw error;
    }
  }

  /**
   * Check categories needing sync and sync them
   */
  async checkAndSyncCategories() {
    try {
      const categoriesNeedingSync = await Category.findNeedingSync();
      
      if (categoriesNeedingSync.length === 0) {
        console.log('ℹ️  No categories need syncing at this time');
        return;
      }

      console.log(`🔄 Found ${categoriesNeedingSync.length} categories needing sync`);

      for (const category of categoriesNeedingSync) {
        try {
          console.log(`🔄 Auto-syncing category: ${category.name}`);
          
          // Mark as queued
          category.lastSyncStatus = 'queued';
          await category.save();

          const results = await this.syncCategoryProductsToDatabase(category, category.maxProducts || 50);
          
          // Update category with results
          category.lastSyncAt = new Date();
          category.lastSyncStatus = 'completed';
          category.lastSyncResults = {
            success: results.success,
            failed: results.failed,
            errors: results.errors.slice(0, 5),
            syncedBy: 'automated-job',
            syncedAt: new Date().toISOString()
          };
          await category.save();

          console.log(`✅ Auto-sync completed for ${category.name}: ${results.success} products`);

          // Rate limiting between categories
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`❌ Auto-sync failed for category ${category.name}:`, error);
          
          // Update category with failure
          category.lastSyncAt = new Date();
          category.lastSyncStatus = 'failed';
          category.lastSyncResults = {
            error: error.message,
            syncedBy: 'automated-job',
            syncedAt: new Date().toISOString()
          };
          await category.save();
        }
      }

    } catch (error) {
      console.error('❌ Check and sync categories error:', error);
    }
  }

  /**
   * Perform daily cleanup operations
   */
  async performDailyCleanup() {
    try {
      // Clean up old sync results (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const cleanupResults = await Category.updateMany(
        { 'lastSyncResults': { $exists: true }, 'updated_at': { $lt: thirtyDaysAgo } },
        { $unset: { lastSyncResults: 1 } }
      );

      console.log(`🧹 Cleaned up sync results for ${cleanupResults.modifiedCount} categories`);

      // Remove inactive products older than 60 days
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      
      const deletedProducts = await Product.deleteMany({
        isActive: false,
        'updated_at': { $lt: sixtyDaysAgo }
      });

      console.log(`🗑️  Removed ${deletedProducts.deletedCount} old inactive products`);

    } catch (error) {
      console.error('❌ Daily cleanup error:', error);
    }
  }

  /**
   * Perform weekly maintenance operations
   */
  async performWeeklyMaintenance() {
    try {
      // Generate product statistics
      const stats = await this.generateProductStats();
      console.log('📊 Weekly product statistics:', stats);

      // Check for products with sync errors
      const failedProducts = await Product.countDocuments({
        'scrapingInfo.syncStatus': 'failed'
      });

      if (failedProducts > 0) {
        console.log(`⚠️  Found ${failedProducts} products with sync failures`);
      }

      // Check API quota usage (if available)
      try {
        await scrapingDogService.searchProducts('test', '110001', 1);
        console.log('✅ API connectivity check passed');
      } catch (error) {
        console.error('❌ API connectivity check failed:', error);
      }

    } catch (error) {
      console.error('❌ Weekly maintenance error:', error);
    }
  }

  /**
   * Generate product statistics
   */
  async generateProductStats() {
    try {
      const totalProducts = await Product.countDocuments({ isActive: true });
      const totalCategories = await Category.countDocuments({ isActive: true });
      
      const recentlyUpdated = await Product.countDocuments({
        'scrapingInfo.lastSyncAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const highQuality = await Product.countDocuments({ quality: 'high' });
      const averagePrice = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, avgPrice: { $avg: '$pricing.current' } } }
      ]);

      return {
        totalProducts,
        totalCategories,
        recentlyUpdated,
        highQualityProducts: highQuality,
        averagePrice: averagePrice[0]?.avgPrice?.toFixed(2) || 0
      };

    } catch (error) {
      console.error('❌ Generate stats error:', error);
      return {};
    }
  }

  /**
   * Helper function to sync category products to database
   */
  async syncCategoryProductsToDatabase(category, maxProducts = 50) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      const searchQueries = category.searchQueries && category.searchQueries.length > 0
        ? category.searchQueries
        : scrapingDogService.generateCategoryQueries(category.name).slice(0, 3);
      
      const pincodes = ['110001', '400001', '560001']; // Major cities
      
      for (const query of searchQueries) {
        for (const pincode of pincodes) {
          try {
            const products = await scrapingDogService.searchProducts(query, pincode, 10);
            
            for (const productData of products) {
              if (results.success >= maxProducts) break;
              
              try {
                const parsedProduct = scrapingDogService.parseProductDataEnhanced(
                  productData, 
                  category, 
                  { query, pincode }
                );
                
                if (parsedProduct) {
                  const existingProduct = await Product.findOne({ asin: parsedProduct.asin });
                  
                  if (existingProduct) {
                    Object.assign(existingProduct, parsedProduct);
                    await existingProduct.save();
                  } else {
                    const newProduct = new Product(parsedProduct);
                    await newProduct.save();
                  }
                  
                  results.success++;
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
              } catch (error) {
                results.failed++;
                results.errors.push(`Product save error: ${error.message}`);
              }
            }
            
            if (results.success >= maxProducts) break;
            
            // Rate limiting between searches
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            results.errors.push(`Search error: ${error.message}`);
          }
        }
        
        if (results.success >= maxProducts) break;
      }
      
    } catch (error) {
      results.errors.push(`Category sync error: ${error.message}`);
    }

    return results;
  }

  /**
   * Stop all jobs
   */
  stop() {
    console.log('🛑 Stopping Amazon sync jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ All Amazon sync jobs stopped');
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalJobs: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    };
  }
}

module.exports = new AmazonSyncJobs();
