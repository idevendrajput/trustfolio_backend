#!/usr/bin/env node

const oxylabsService = require('./services/oxylabsService');

async function testIndianLocalization() {
  console.log('🇮🇳 Testing Indian Localization with Oxylabs...\n');
  
  try {
    console.log('📱 Testing searchProducts method with Indian settings...');
    
    // Test the searchProducts method with a simple query
    const results = await oxylabsService.searchProducts('mobile phone', 50000, ['smartphone', 'india'], 5);
    
    console.log('\n✅ SUCCESS!');
    console.log(`📊 Found ${results.length} products`);
    
    if (results.length > 0) {
      console.log('\n🎯 Sample products:');
      results.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   💰 Price: ₹${product.price || 'Price not available'}`);
        console.log(`   ⭐ Rating: ${product.rating || 'No rating'}`);
        console.log(`   🔗 URL: ${product.url?.substring(0, 80)}...`);
        
        // Check if price conversion worked
        if (product.price && product.price > 1000) {
          console.log(`   ✅ Price appears to be in INR (${product.price})`);
        } else if (product.price && product.price < 1000) {
          console.log(`   ⚠️  Price might need conversion (${product.price})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('💢 Response:', error.response.data);
    }
  }
}

testIndianLocalization();
