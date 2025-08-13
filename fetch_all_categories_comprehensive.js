const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_BASE = 'https://api.trustfolio.in/api';

let adminToken = null;

async function loginAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@trustfolio.com',
      password: 'password123'
    });
    adminToken = response.data.data.token;
    console.log('✅ Admin login successful');
    return adminToken;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getCategories() {
  try {
    const response = await axios.get(`${API_BASE}/categories`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get categories:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchProductsForCategory(categoryId, categoryName) {
  try {
    console.log(`🔄 Fetching products for ${categoryName}...`);
    
    const response = await axios.post(
      `${API_BASE}/products/fetch-category/${categoryId}`,
      {
        productsPerRange: 25, // Increase products per range
        skipExisting: false   // Don't skip to get fresh data
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = response.data.data;
    const totalAdded = result.added;
    const totalErrors = result.ranges.reduce((acc, range) => acc + range.errors.length, 0);
    
    console.log(`✅ ${categoryName}: ${totalAdded} products added, ${totalErrors} errors`);
    
    // Show breakdown by price range
    result.ranges.forEach(range => {
      if (range.added > 0 || range.errors.length > 0) {
        console.log(`   📊 ${range.range}: ${range.added} added, ${range.errors.length} errors`);
      }
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch products for ${categoryName}:`, error.response?.data || error.message);
    return { added: 0, skipped: 0, ranges: [] };
  }
}

async function getProductCountsByCategory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Product = require('./models/Product');
    const Category = require('./models/Category');
    
    console.log('\n=== FINAL PRODUCT COUNTS BY CATEGORY ===');
    const categories = await Category.find({}, 'name').sort({ name: 1 });
    
    let totalProducts = 0;
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category._id });
      console.log(`${category.name.padEnd(20)}: ${count} products`);
      totalProducts += count;
    }
    
    console.log(`${'Total'.padEnd(20)}: ${totalProducts} products\n`);
    
    // Show sample products from each category
    console.log('=== SAMPLE PRODUCTS BY CATEGORY ===');
    for (const category of categories) {
      const products = await Product.find({ category: category._id })
        .sort({ 'pricing.current': 1 }) // Sort by price
        .limit(2);
      
      if (products.length > 0) {
        console.log(`\n${category.name}:`);
        products.forEach(p => {
          console.log(`  - ${p.title.substring(0, 60)}... | ₹${p.pricing?.current || 'N/A'}`);
        });
      }
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Failed to get product counts:', error.message);
  }
}

async function fetchAllCategories() {
  try {
    console.log('🚀 Starting comprehensive product fetching for ALL categories...\n');
    
    // Login as admin
    await loginAdmin();
    
    // Get all categories
    const categories = await getCategories();
    console.log(`📋 Found ${categories.length} categories\n`);
    
    const results = {
      totalCategories: categories.length,
      totalAdded: 0,
      totalSkipped: 0,
      categoryResults: []
    };
    
    // Fetch products for each category
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      console.log(`\n[${i + 1}/${categories.length}] Processing: ${category.name}`);
      console.log('='.repeat(60));
      
      const categoryResult = await fetchProductsForCategory(category._id, category.name);
      
      results.totalAdded += categoryResult.added;
      results.totalSkipped += categoryResult.skipped;
      results.categoryResults.push({
        name: category.name,
        added: categoryResult.added,
        ranges: categoryResult.ranges
      });
      
      // Wait between categories to avoid overwhelming the API
      if (i < categories.length - 1) {
        console.log('⏳ Waiting 5 seconds before next category...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Show final summary
    console.log('\n🎉 COMPREHENSIVE FETCHING COMPLETED!');
    console.log('=' .repeat(60));
    console.log(`📊 Total products added: ${results.totalAdded}`);
    console.log(`📊 Categories processed: ${results.totalCategories}`);
    
    // Show breakdown by category
    console.log('\n📋 BREAKDOWN BY CATEGORY:');
    results.categoryResults.forEach(result => {
      console.log(`${result.name.padEnd(20)}: ${result.added} products`);
    });
    
    // Wait for DB writes to complete
    console.log('\n⏳ Waiting for database writes to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get final counts
    await getProductCountsByCategory();
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive fetch
fetchAllCategories();
