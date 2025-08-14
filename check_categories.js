require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    const categories = await Category.find({}).select('name title priceRanges');
    console.log('📂 Existing categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.title}) - Price Ranges: ${cat.priceRanges?.length || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkCategories();
