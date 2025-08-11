#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testLogin() {
  console.log('🧪 Testing Admin Login API...\n');

  try {
    // Test login
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@trustfolio.com',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('Admin:', loginResponse.data.data.admin.name);
      console.log('Role:', loginResponse.data.data.admin.role);
      console.log('Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
      
      const token = loginResponse.data.data.token;
      
      // Test authenticated endpoint
      console.log('\n2. Testing authenticated endpoint...');
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (profileResponse.data.success) {
        console.log('✅ Authenticated request successful!');
        console.log('Admin profile:', profileResponse.data.data.admin.name);
        console.log('Email:', profileResponse.data.data.admin.email);
        console.log('Permissions:', profileResponse.data.data.admin.permissions);
      }

      // Test token verification
      console.log('\n3. Testing token verification...');
      const verifyResponse = await axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (verifyResponse.data.success) {
        console.log('✅ Token verification successful!');
      }

    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Make sure the backend server is running on port 3001');
      console.log('Run: npm run dev');
    }
  }
}

// Test with wrong credentials
async function testInvalidLogin() {
  console.log('\n4. Testing invalid login...');
  
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@trustfolio.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid login properly rejected');
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message);
    }
  }
}

// Run tests
async function runTests() {
  await testLogin();
  await testInvalidLogin();
  
  console.log('\n✅ Admin login API tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Integrate the API with your admin React app');
  console.log('2. Use the provided Firebase config');
  console.log('3. Replace Firebase Auth with MongoDB/JWT auth calls');
}

runTests().catch(console.error);
