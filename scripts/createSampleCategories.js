const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const sampleCategories = [
  {
    name: 'Mobiles',
    title: 'Latest Smartphones',
    description: 'Find the best smartphones within your budget from top brands',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    searchKeywords: ['smartphone', 'mobile phone', 'android', 'iphone'],
    priceRange: {
      min: 1000,
      max: 250000,
      step: 2000
    },
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Laptops',
    title: 'Best Laptops for Work & Gaming',
    description: 'Discover top laptops for work, gaming, and study',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    searchKeywords: ['laptop', 'notebook', 'gaming laptop', 'work laptop'],
    priceRange: {
      min: 20000,
      max: 500000,
      step: 5000
    },
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Televisions',
    title: 'Smart TVs & LED Displays',
    description: 'Explore smart TVs and LED displays for entertainment',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    searchKeywords: ['smart tv', 'led tv', 'television', '4k tv', 'oled'],
    priceRange: {
      min: 8000,
      max: 300000,
      step: 3000
    },
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Headphones',
    title: 'Audio Devices & Earphones',
    description: 'Find the best headphones and earphones for music',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
    searchKeywords: ['headphones', 'earphones', 'wireless headphones', 'bluetooth headphones'],
    priceRange: {
      min: 200,
      max: 50000,
      step: 1000
    },
    sortOrder: 4,
    isActive: true
  },
  {
    name: 'Air Conditioners',
    title: 'AC & Cooling Solutions',
    description: 'Best air conditioners for home and office cooling',
    image: 'https://images.unsplash.com/photo-1581791538302-cd5cd5d8c6dc?w=400',
    searchKeywords: ['air conditioner', 'ac', 'split ac', 'window ac', 'inverter ac'],
    priceRange: {
      min: 15000,
      max: 200000,
      step: 5000
    },
    sortOrder: 5,
    isActive: true
  },
  {
    name: 'Tablets',
    title: 'Tablets & iPads',
    description: 'Explore tablets for work, study, and entertainment',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
    searchKeywords: ['tablet', 'ipad', 'android tablet', 'tab'],
    priceRange: {
      min: 5000,
      max: 150000,
      step: 2500
    },
    sortOrder: 6,
    isActive: true
  },
  {
    name: 'Washing Machines',
    title: 'Washing Machines & Laundry',
    description: 'Top-rated washing machines for your home',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    searchKeywords: ['washing machine', 'front load', 'top load', 'automatic washing machine'],
    priceRange: {
      min: 12000,
      max: 100000,
      step: 3000
    },
    sortOrder: 7,
    isActive: true
  },
  {
    name: 'Refrigerators',
    title: 'Refrigerators & Freezers',
    description: 'Energy-efficient refrigerators for modern kitchens',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400',
    searchKeywords: ['refrigerator', 'fridge', 'double door fridge', 'single door fridge'],
    priceRange: {
      min: 10000,
      max: 150000,
      step: 4000
    },
    sortOrder: 8,
    isActive: true
  }
];

const createSampleCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'trustfolio'
    });
    
    console.log('✅ MongoDB Connected Successfully');
    
    // Delete existing categories if any
    const deleteResult = await Category.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing categories`);
    
    // Create sample categories one by one to trigger pre-save hooks
    const createdCategories = [];
    
    for (const categoryData of sampleCategories) {
      const category = new Category(categoryData);
      const savedCategory = await category.save();
      createdCategories.push(savedCategory);
      console.log(`  ✅ Created: ${savedCategory.name} (slug: ${savedCategory.slug})`);
    }
    
    console.log(`\n🎯 Created ${createdCategories.length} sample categories:`);
    createdCategories.forEach(cat => {
      console.log(`  📦 ${cat.name} (₹${cat.priceRange.min} - ₹${cat.priceRange.max}, step: ₹${cat.priceRange.step})`);
    });
    
    console.log('\n🎯 Sample categories are ready for scraping!');
    
  } catch (error) {
    console.error('❌ Error creating sample categories:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

createSampleCategories();
