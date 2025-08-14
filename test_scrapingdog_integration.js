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
const scrapingDogService = require('./services/scrapingDogService');
const Category = require('./models/Category');

async function testScrapingDogIntegration() {
  try {
    console.log('🚀 Testing ScrapingDog Integration...\n');

    // Connect to database
    await connectDB();

    // Test 1: Check ScrapingDog service basic functionality
    console.log('📋 Test 1: ScrapingDog Service Basic Test');
    console.log(`   API Key: ${scrapingDogService.apiKey ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Price Ranges: ${scrapingDogService.getPriceRanges().length} configured`);
    
    // Display available price ranges
    console.log('   Available Price Ranges:');
    scrapingDogService.getPriceRanges().forEach(range => {
      console.log(`     - ${range.name}: ₹${range.min}-₹${range.max} (${range.query})`);
    });

    // Test 2: Test single API call
    console.log('\n📡 Test 2: Single API Call Test');
    try {
      const testProducts = await scrapingDogService.makeRequest({
        query: 'best smartphone under 10000',
        page: '1'
      });
      console.log(`   ✅ API call successful: ${testProducts.length} products returned`);
      
      if (testProducts.length > 0) {
        const firstProduct = testProducts[0];
        console.log(`   📱 Sample Product: ${firstProduct.title?.substring(0, 50)}...`);
        console.log(`   💰 Price: ${firstProduct.price_string}`);
        console.log(`   ⭐ Rating: ${firstProduct.stars} (${firstProduct.total_reviews} reviews)`);
        console.log(`   🔗 ASIN: ${scrapingDogService.extractASIN(firstProduct)}`);
      }
    } catch (error) {
      console.log(`   ❌ API call failed: ${error.message}`);
    }

    // Test 3: Test price extraction
    console.log('\n🔢 Test 3: Price Extraction Test');
    const testPrices = ['₹4,399', '₹10,999', '₹1,52,000', '$299', '2,500'];
    testPrices.forEach(priceString => {
      const extracted = scrapingDogService.extractNumericPrice(priceString);
      console.log(`   ${priceString} → ${extracted}`);
    });

    // Test 4: Test with real category
    console.log('\n📂 Test 4: Real Category Test');
    try {
      const category = await Category.findOne({ isActive: true });
      
      if (category) {
        console.log(`   Found category: ${category.name}`);
        
        // Test single range search
        console.log(`   Testing single range search for "${category.name}" in "under_10k"...`);
        const rangeProducts = await scrapingDogService.searchProductsForRange(
          category.name, 
          'under_10k', 
          { maxPages: 1, maxProducts: 5 }
        );
        
        console.log(`   ✅ Range search successful: ${rangeProducts.length} products`);
        
        if (rangeProducts.length > 0) {
          console.log(`   📦 Product Examples:`);
          rangeProducts.slice(0, 3).forEach((product, index) => {
            console.log(`     ${index + 1}. ${product.title?.substring(0, 40)}... - ${product.price_string}`);
          });
        }
        
        // Test product parsing
        if (rangeProducts.length > 0) {
          console.log('\n   Testing product parsing...');
          const parsedProduct = scrapingDogService.parseProductData(
            rangeProducts[0], 
            category, 
            { query: 'test', priceRange: 'under_10k' }
          );
          
          if (parsedProduct) {
            console.log(`   ✅ Product parsing successful`);
            console.log(`     - Title: ${parsedProduct.title.substring(0, 50)}...`);
            console.log(`     - Price: ₹${parsedProduct.pricing.current}`);
            console.log(`     - Quality: ${parsedProduct.quality}`);
            console.log(`     - Brand: ${parsedProduct.brand || 'Not detected'}`);
          } else {
            console.log(`   ❌ Product parsing failed`);
          }
        }
        
      } else {
        console.log('   ⚠️  No active categories found in database');
      }
    } catch (error) {
      console.log(`   ❌ Category test failed: ${error.message}`);
    }

    console.log('\n🎉 ScrapingDog Integration Test Completed!\n');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('👋 Database disconnected');
  }
}

// Run the test
testScrapingDogIntegration();
