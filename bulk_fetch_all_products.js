const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_BASE = 'https://api.trustfolio.in/api';

// Budget ranges to test for each category
const budgetRanges = [
  { min: 0, max: 5000, name: 'Budget (₹0-₹5,000)' },
  { min: 5000, max: 15000, name: 'Mid-range (₹5,000-₹15,000)' },
  { min: 15000, max: 50000, name: 'Premium (₹15,000-₹50,000)' },
  { min: 50000, max: 200000, name: 'Luxury (₹50,000-₹2,00,000)' }
];

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
    return response.data.data; // Extract the data array from the response
  } catch (error) {
    console.error('❌ Failed to get categories:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchProductsForCategory(categoryId, categoryName, budget = null) {
  try {
    const params = new URLSearchParams({
      categoryId: categoryId
    });
    
    if (budget) {
      params.append('minPrice', budget.min);
      params.append('maxPrice', budget.max);
    }
    
    console.log(`🔄 Fetching products for ${categoryName}${budget ? ` (${budget.name})` : ''}...`);
    
    const response = await axios.post(
      `${API_BASE}/products/fetch-category?${params.toString()}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ ${categoryName}${budget ? ` (${budget.name})` : ''}: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch products for ${categoryName}${budget ? ` (${budget.name})` : ''}:`, 
      error.response?.data || error.message);
    return null;
  }
}

async function getProductCounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Product = require('./models/Product');
    const Category = require('./models/Category');
    
    console.log('\n=== CURRENT PRODUCT COUNTS ===');
    const categories = await Category.find({}, 'name');
    
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category._id });
      console.log(`${category.name}: ${count} products`);
    }
    
    const totalProducts = await Product.countDocuments();
    console.log(`\nTotal products: ${totalProducts}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Failed to get product counts:', error.message);
  }
}

async function fetchAllProductsComprehensive() {
  try {
    console.log('🚀 Starting comprehensive product fetching...\n');
    
    // Login as admin
    await loginAdmin();
    
    // Get all categories
    const categories = await getCategories();
    console.log(`📋 Found ${categories.length} categories\n`);
    
    // Fetch products for each category with different budget ranges
    for (const category of categories) {
      console.log(`\n📱 Processing category: ${category.name}`);
      console.log('='.repeat(50));
      
      // First, fetch without budget constraints
      await fetchProductsForCategory(category._id, category.name);
      
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then fetch with different budget ranges
      for (const budget of budgetRanges) {
        await fetchProductsForCategory(category._id, category.name, budget);
        
        // Wait between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log(`✅ Completed fetching for ${category.name}\n`);
    }
    
    // Show final counts
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for DB writes
    await getProductCounts();
    
    console.log('\n🎉 Comprehensive product fetching completed!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
fetchAllProductsComprehensive();
