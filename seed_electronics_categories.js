const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const electronicsCategories = [
  {
    name: 'Smartphone',
    title: 'स्मार्टफोन',
    description: 'Mobile phones and smartphones from various brands like Apple, Samsung, OnePlus, Xiaomi',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['mobile', 'phone', 'smartphone', 'android', 'iphone', 'samsung', 'oneplus', 'xiaomi'],
    sortOrder: 10
  },
  {
    name: 'Television',
    title: 'टेलीविजन',
    description: 'Smart TVs, LED TVs, OLED TVs and entertainment displays from Sony, LG, Samsung',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['tv', 'television', 'smart tv', 'led', 'oled', 'sony', 'lg', 'samsung'],
    sortOrder: 9
  },
  {
    name: 'Laptop',
    title: 'लैपटॉप',
    description: 'Laptops, notebooks, and portable computers for work, gaming, and personal use',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['laptop', 'notebook', 'computer', 'gaming laptop', 'macbook', 'dell', 'hp', 'lenovo'],
    sortOrder: 8
  },
  {
    name: 'Air Conditioner',
    title: 'एयर कंडीशनर',
    description: 'Split ACs, window ACs, and cooling appliances for home and office',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['ac', 'air conditioner', 'split ac', 'window ac', 'cooling', 'daikin', 'lg', 'voltas'],
    sortOrder: 7
  },
  {
    name: 'Refrigerator',
    title: 'रेफ्रिजरेटर',
    description: 'Single door, double door refrigerators and deep freezers',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['fridge', 'refrigerator', 'freezer', 'double door', 'single door', 'whirlpool', 'lg', 'samsung'],
    sortOrder: 6
  },
  {
    name: 'Washing Machine',
    title: 'वाशिंग मशीन',
    description: 'Front load, top load washing machines and dryers',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['washing machine', 'washer', 'dryer', 'front load', 'top load', 'lg', 'samsung', 'whirlpool'],
    sortOrder: 5
  },
  {
    name: 'Headphones',
    title: 'हेडफोन',
    description: 'Wireless headphones, earbuds, and audio accessories',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['headphones', 'earbuds', 'earphones', 'wireless', 'bluetooth', 'sony', 'bose', 'airpods'],
    sortOrder: 4
  },
  {
    name: 'Camera',
    title: 'कैमरा',
    description: 'Digital cameras, DSLRs, mirrorless cameras and photography equipment',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['camera', 'dslr', 'mirrorless', 'photography', 'canon', 'nikon', 'sony'],
    sortOrder: 3
  },
  {
    name: 'Gaming Console',
    title: 'गेमिंग कंसोल',
    description: 'Gaming consoles, controllers, and gaming accessories',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['gaming', 'console', 'playstation', 'xbox', 'nintendo', 'controller', 'ps5', 'xbox series'],
    sortOrder: 2
  },
  {
    name: 'Tablet',
    title: 'टैबलेट',
    description: 'Tablets, iPads, and portable computing devices',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['tablet', 'ipad', 'android tablet', 'samsung tab', 'lenovo tab'],
    sortOrder: 1
  },
  {
    name: 'Smartwatch',
    title: 'स्मार्टवॉच',
    description: 'Smartwatches, fitness trackers, and wearable devices',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&crop=center',
    searchKeywords: ['smartwatch', 'fitness tracker', 'wearable', 'apple watch', 'samsung watch', 'fitbit'],
    sortOrder: 0
  }
];

async function seedElectronicsCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all existing categories
    const deleteResult = await Category.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing categories`);

    // Insert new electronics categories
    const insertedCategories = await Category.insertMany(electronicsCategories);
    console.log(`\nSeeded ${insertedCategories.length} electronics categories:`);
    
    insertedCategories.forEach(category => {
      console.log(`✓ ${category.title} (${category.name}) - ID: ${category._id}`);
    });

    console.log('\n🎉 Categories seeded successfully with real images!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedElectronicsCategories();
}

module.exports = { seedElectronicsCategories, electronicsCategories };
