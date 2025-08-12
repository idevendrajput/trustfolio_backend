const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const electronicsCategories = [
  {
    name: 'Mobile Phones',
    title: 'Mobile Phones',
    description: 'Latest smartphones with best features and price in India',
    image: '/uploads/categories/mobile-phones.jpg',
    isActive: true,
    sortOrder: 1,
    searchKeywords: ['smartphone', 'mobile', 'phone', 'android', 'iphone', 'samsung', 'oneplus', 'xiaomi', 'realme', 'vivo', 'oppo']
  },
  {
    name: 'Laptops',
    title: 'Laptops',
    description: 'Gaming laptops, business laptops and budget-friendly options',
    image: '/uploads/categories/laptops.jpg',
    isActive: true,
    sortOrder: 2,
    searchKeywords: ['laptop', 'gaming laptop', 'business laptop', 'notebook', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'macbook']
  },
  {
    name: 'Television',
    title: 'Television & Smart TV',
    description: 'Smart TVs, LED TVs and entertainment systems',
    image: '/uploads/categories/television.jpg',
    isActive: true,
    sortOrder: 3,
    searchKeywords: ['tv', 'television', 'smart tv', 'led tv', 'oled', 'qled', 'sony', 'samsung', 'lg', 'mi tv', 'tcl']
  },
  {
    name: 'Air Conditioners',
    title: 'Air Conditioners',
    description: 'Split AC, Window AC and Inverter AC for home cooling',
    image: '/uploads/categories/air-conditioners.jpg',
    isActive: true,
    sortOrder: 4,
    searchKeywords: ['ac', 'air conditioner', 'split ac', 'window ac', 'inverter ac', 'voltas', 'lg', 'daikin', 'hitachi', 'carrier']
  },
  {
    name: 'Refrigerators',
    title: 'Refrigerators',
    description: 'Single door, double door and side by side refrigerators',
    image: '/uploads/categories/refrigerators.jpg',
    isActive: true,
    sortOrder: 5,
    searchKeywords: ['fridge', 'refrigerator', 'double door', 'single door', 'side by side', 'lg', 'samsung', 'whirlpool', 'haier', 'godrej']
  },
  {
    name: 'Washing Machines',
    title: 'Washing Machines',
    description: 'Front load, top load and semi-automatic washing machines',
    image: '/uploads/categories/washing-machines.jpg',
    isActive: true,
    sortOrder: 6,
    searchKeywords: ['washing machine', 'front load', 'top load', 'semi automatic', 'fully automatic', 'lg', 'samsung', 'whirlpool', 'bosch', 'ifb']
  },
  {
    name: 'Headphones',
    title: 'Headphones & Earphones',
    description: 'Wireless headphones, earbuds and gaming headsets',
    image: '/uploads/categories/headphones.jpg',
    isActive: true,
    sortOrder: 7,
    searchKeywords: ['headphones', 'earphones', 'wireless', 'earbuds', 'gaming headset', 'sony', 'bose', 'jbl', 'boat', 'airpods', 'noise']
  },
  {
    name: 'Cameras',
    title: 'Cameras & Photography',
    description: 'DSLR, mirrorless cameras and photography accessories',
    image: '/uploads/categories/cameras.jpg',
    isActive: true,
    sortOrder: 8,
    searchKeywords: ['camera', 'dslr', 'mirrorless', 'lens', 'photography', 'canon', 'nikon', 'sony', 'fujifilm', 'gopro']
  },
  {
    name: 'Tablets',
    title: 'Tablets',
    description: 'iPads, Android tablets and 2-in-1 convertible devices',
    image: '/uploads/categories/tablets.jpg',
    isActive: true,
    sortOrder: 9,
    searchKeywords: ['tablet', 'ipad', 'android tablet', '2 in 1', 'convertible', 'apple', 'samsung', 'lenovo', 'microsoft surface']
  },
  {
    name: 'Smartwatches',
    title: 'Smartwatches & Fitness Bands',
    description: 'Fitness trackers, smartwatches and wearable technology',
    image: '/uploads/categories/smartwatches.jpg',
    isActive: true,
    sortOrder: 10,
    searchKeywords: ['smartwatch', 'fitness band', 'fitness tracker', 'wearable', 'apple watch', 'samsung galaxy watch', 'amazfit', 'fitbit', 'garmin', 'noise', 'boat']
  },
  {
    name: 'Gaming Consoles',
    title: 'Gaming Consoles & Accessories',
    description: 'PlayStation, Xbox, Nintendo and gaming accessories',
    image: '/uploads/categories/gaming-consoles.jpg',
    isActive: true,
    sortOrder: 11,
    searchKeywords: ['gaming console', 'playstation', 'xbox', 'nintendo', 'ps5', 'xbox series', 'gaming controller', 'gaming accessories']
  },
  {
    name: 'Computer Components',
    title: 'Computer Components',
    description: 'PC building components, graphics cards, processors and more',
    image: '/uploads/categories/computer-components.jpg',
    isActive: true,
    sortOrder: 12,
    searchKeywords: ['cpu', 'processor', 'graphics card', 'motherboard', 'ram', 'ssd', 'hard drive', 'power supply', 'pc components', 'intel', 'amd', 'nvidia']
  }
];

const seedElectronicsCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'trustfolio'
    });
    console.log('Connected to MongoDB');

    // Delete existing categories
    await Category.deleteMany({});
    console.log('Deleted existing categories');

    // Insert new electronics categories
    const insertedCategories = await Category.insertMany(electronicsCategories);
    console.log(`Inserted ${insertedCategories.length} electronics categories`);

    console.log('\nSeeded Categories:');
    insertedCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.title} (${category.name})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding electronics categories:', error);
    process.exit(1);
  }
};

seedElectronicsCategories();
