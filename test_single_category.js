const axios = require('axios');

const API_BASE = 'https://api.trustfolio.in/api';

async function testSingleCategory() {
  try {
    console.log('🔑 Logging in...');
    
    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@trustfolio.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Get categories
    console.log('📋 Getting categories...');
    const categoriesResponse = await axios.get(`${API_BASE}/categories`);
    const categories = categoriesResponse.data.data;
    console.log(`Found ${categories.length} categories`);
    
    // Test fetching products for Smartphone category
    const smartphoneCategory = categories.find(cat => cat.name === 'Smartphone');
    if (!smartphoneCategory) {
      console.log('❌ Smartphone category not found');
      return;
    }
    
    console.log(`\n🔄 Fetching products for Smartphone (ID: ${smartphoneCategory._id})...`);
    
    const fetchResponse = await axios.post(
      `${API_BASE}/products/fetch-category/${smartphoneCategory._id}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Fetch response:', JSON.stringify(fetchResponse.data, null, 2));
    
    // Check products in database
    console.log('\n📊 Checking products in database...');
    
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Total products: ${productsResponse.data.data.pagination?.total || 0}`);
    
    if (productsResponse.data.data.products && productsResponse.data.data.products.length > 0) {
      console.log('\n📱 Sample products:');
      productsResponse.data.data.products.slice(0, 3).forEach(product => {
        console.log(`- ${product.title} | ₹${product.pricing?.current || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSingleCategory();
