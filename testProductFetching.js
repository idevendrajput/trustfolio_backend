const mongoose = require('mongoose');
const productFetchingService = require('./services/productFetchingService');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'trustfolio'
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Test product fetching for a specific category
const testCategoryFetching = async (categoryName = 'smartphones') => {
  try {
    console.log(`🔍 Testing product fetching for category: ${categoryName}`);
    
    // Find category by name
    const Category = require('./models/Category');
    const category = await Category.findOne({ 
      $or: [
        { name: new RegExp(categoryName, 'i') },
        { title: new RegExp(categoryName, 'i') }
      ]
    });
    
    if (!category) {
      console.error(`❌ Category '${categoryName}' not found`);
      return;
    }
    
    console.log(`📂 Found category: ${category.title} (${category.name})`);
    
    // Test fetching for one price range
    const result = await productFetchingService.fetchProductsForCategory(category, 5, false);
    
    console.log('\n📊 Results:');
    console.log(`✅ Successfully processed: ${result.success}`);
    console.log(`📦 Products added: ${result.added}`);
    console.log(`⏭️  Products skipped: ${result.skipped}`);
    
    if (result.ranges) {
      console.log('\n💰 Price Range Details:');
      result.ranges.forEach(range => {
        console.log(`  ${range.range}: ${range.added} added, ${range.skipped} skipped`);
        if (range.errors.length > 0) {
          console.log(`    Errors: ${range.errors.join(', ')}`);
        }
      });
    }
    
    if (result.error) {
      console.error(`❌ Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Test getting product stats
const testProductStats = async () => {
  try {
    console.log('\n📈 Testing product statistics...');
    
    const stats = await productFetchingService.getProductsStats();
    
    console.log('\n📊 Product Statistics:');
    console.log(`📦 Total Products: ${stats.totalProducts}`);
    
    if (stats.categoriesStats && stats.categoriesStats.length > 0) {
      console.log('\n📂 Category Stats:');
      stats.categoriesStats.slice(0, 5).forEach(cat => {
        console.log(`  ${cat._id}: ${cat.count} products, Avg: ₹${Math.round(cat.avgPrice || 0)}`);
      });
    }
    
    if (stats.priceRangeStats && stats.priceRangeStats.length > 0) {
      console.log('\n💰 Price Range Stats:');
      stats.priceRangeStats.forEach(range => {
        console.log(`  ${range._id}: ${range.count} products, Avg: ₹${Math.round(range.avgPrice || 0)}`);
      });
    }
    
    if (stats.qualityStats && stats.qualityStats.length > 0) {
      console.log('\n🎯 Quality Stats:');
      stats.qualityStats.forEach(quality => {
        console.log(`  ${quality._id}: ${quality.count} products`);
      });
    }
    
  } catch (error) {
    console.error('❌ Stats test failed:', error.message);
  }
};

// Test getting recent products
const testRecentProducts = async () => {
  try {
    console.log('\n🕒 Testing recent products...');
    
    const Product = require('./models/Product');
    const recentProducts = await Product.find({ isActive: true })
      .sort({ 'scrapingInfo.scrapedAt': -1 })
      .limit(5)
      .populate('category', 'name title');
    
    console.log('\n📦 Recent Products:');
    recentProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title.substring(0, 50)}...`);
      console.log(`     Category: ${product.category?.title || 'Unknown'}`);
      console.log(`     Price: ₹${product.pricing.current}`);
      console.log(`     Quality: ${product.quality}`);
      console.log(`     Scraped: ${product.scrapingInfo.scrapedAt.toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Recent products test failed:', error.message);
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Product Fetching Tests\n');
  
  await connectDB();
  
  // Run tests
  await testCategoryFetching('smartphones'); // Test with smartphones category
  await testProductStats();
  await testRecentProducts();
  
  console.log('\n✅ All tests completed!');
  process.exit(0);
};

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'category' && args[1]) {
  // Test specific category: node testProductFetching.js category smartphones
  connectDB().then(() => testCategoryFetching(args[1])).then(() => process.exit(0));
} else if (command === 'stats') {
  // Test stats only: node testProductFetching.js stats
  connectDB().then(() => testProductStats()).then(() => process.exit(0));
} else if (command === 'recent') {
  // Test recent products: node testProductFetching.js recent
  connectDB().then(() => testRecentProducts()).then(() => process.exit(0));
} else {
  // Run all tests: node testProductFetching.js
  runTests();
}
