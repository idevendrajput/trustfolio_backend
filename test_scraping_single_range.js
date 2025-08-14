const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustfolio', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Import services
const productScrapingService = require('./services/productScrapingService');
const Category = require('./models/Category');
const Product = require('./models/Product');

async function testSingleRangeScraping() {
  try {
    console.log('🚀 Testing Single Range Product Scraping...\n');

    // Connect to database
    await connectDB();

    // Find a category to test with
    const category = await Category.findOne({ isActive: true });
    if (!category) {
      console.log('❌ No active categories found. Please create categories first.');
      return;
    }

    console.log(`📂 Testing with category: ${category.name}`);
    console.log(`🔍 Category ID: ${category._id}`);

    // Check existing products for this category
    const existingCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });
    console.log(`📊 Existing products in category: ${existingCount}`);

    // Test scraping for a single price range
    const testPriceRange = 'under_10k';
    console.log(`\n🎯 Testing scraping for price range: ${testPriceRange}`);
    console.log('⏳ This may take a few moments...\n');

    const result = await productScrapingService.scrapeCategoryByRange(
      category._id.toString(),
      testPriceRange,
      {
        maxPages: 1,    // Just 1 page for testing
        maxProducts: 5  // Only 5 products for quick test
      }
    );

    console.log('\n📋 Scraping Results:');
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Price Range: ${result.priceRange}`);
    console.log(`   Products Processed: ${result.stats.totalProcessed}`);
    console.log(`   Products Saved: ${result.stats.totalSaved}`);
    console.log(`   Errors: ${result.stats.totalErrors}`);

    if (result.success && result.stats.totalSaved > 0) {
      console.log('\n🎉 Great! Products were successfully scraped and saved.');
      
      // Show some saved products
      const savedProducts = await Product.find({
        category: category._id,
        'pricing.priceRange': testPriceRange
      }).limit(3).lean();

      console.log('\n📦 Sample saved products:');
      savedProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title.substring(0, 50)}...`);
        console.log(`      Price: ₹${product.pricing.current} | Rating: ${product.rating.average} | ASIN: ${product.asin}`);
      });
    } else {
      console.log('⚠️  No products were saved. This could be normal if products already exist.');
    }

    // Final count
    const finalCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });
    console.log(`\n📈 Total products in category after scraping: ${finalCount}`);
    console.log(`📊 New products added: ${finalCount - existingCount}`);

    console.log('\n✅ Single range scraping test completed!\n');

  } catch (error) {
    console.error('❌ Scraping test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.disconnect();
    console.log('👋 Database disconnected');
  }
}

// Run the test
testSingleRangeScraping();
