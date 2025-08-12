const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const electronicsCategories = [
  {
    name: 'Smartphone',
    title: 'स्मार्टफोन',
    description: 'Mobile phones and smartphones from various brands',
    isActive: true,
    image: '/uploads/categories/smartphone.jpg',
    searchKeywords: ['mobile', 'phone', 'smartphone', 'android', 'iphone']
  },
  {
    name: 'Television',
    title: 'टेलीविजन',
    description: 'Smart TVs, LED TVs, and entertainment displays',
    isActive: true,
    image: '/uploads/categories/television.jpg',
    searchKeywords: ['tv', 'television', 'smart tv', 'led', 'oled']
  },
  {
    name: 'Laptop',
    title: 'लैपटॉप',
    description: 'Laptops, notebooks, and portable computers',
    isActive: true,
    image: '/uploads/categories/laptop.jpg',
    searchKeywords: ['laptop', 'notebook', 'computer', 'gaming laptop']
  },
  {
    name: 'Air Conditioner',
    title: 'एयर कंडीशनर',
    description: 'AC units, split ACs, and cooling appliances',
    isActive: true,
    image: '/uploads/categories/ac.jpg',
    searchKeywords: ['ac', 'air conditioner', 'split ac', 'window ac']
  },
  {
    name: 'Refrigerator',
    title: 'रेफ्रिजरेटर',
    description: 'Fridges, deep freezers, and cooling appliances',
    isActive: true,
    image: '/uploads/categories/refrigerator.jpg',
    searchKeywords: ['fridge', 'refrigerator', 'freezer']
  },
  {
    name: 'Washing Machine',
    title: 'वाशिंग मशीन',
    description: 'Washing machines, dryers, and laundry appliances',
    isActive: true,
    image: '/uploads/categories/washing-machine.jpg',
    searchKeywords: ['washing machine', 'washer', 'dryer']
  },
  {
    name: 'Headphones',
    title: 'हेडफोन',
    description: 'Headphones, earbuds, and audio accessories',
    isActive: true,
    image: '/uploads/categories/headphones.jpg',
    searchKeywords: ['headphones', 'earbuds', 'earphones']
  },
  {
    name: 'Camera',
    title: 'कैमरा',
    description: 'Digital cameras, DSLRs, and photography equipment',
    isActive: true,
    image: '/uploads/categories/camera.jpg',
    searchKeywords: ['camera', 'dslr', 'photography']
  },
  {
    name: 'Gaming Console',
    title: 'गेमिंग कंसोल',
    description: 'Gaming consoles, controllers, and gaming accessories',
    isActive: true,
    image: '/uploads/categories/gaming-console.jpg',
    searchKeywords: ['gaming', 'console', 'playstation', 'xbox']
  },
  {
    name: 'Tablet',
    title: 'टैबलेट',
    description: 'Tablets, iPads, and portable computing devices',
    isActive: true,
    image: '/uploads/categories/tablet.jpg',
    searchKeywords: ['tablet', 'ipad', 'android tablet']
  },
  {
    name: 'Smartwatch',
    title: 'स्मार्टवॉच',
    description: 'Smartwatches, fitness trackers, and wearable devices',
    isActive: true,
    image: '/uploads/categories/smartwatch.jpg',
    searchKeywords: ['smartwatch', 'fitness tracker', 'wearable']
  },
  {
    name: 'Speaker',
    title: 'स्पीकर',
    description: 'Bluetooth speakers, sound systems, and audio equipment',
    isActive: true,
    image: '/uploads/categories/speaker.jpg',
    searchKeywords: ['speaker', 'bluetooth speaker', 'sound system']
  }
];

async function clearAndSeedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all existing categories
    await Category.deleteMany({});
    console.log('Cleared all existing categories');

    // Insert new electronics categories
    const insertedCategories = await Category.insertMany(electronicsCategories);
    console.log(`Seeded ${insertedCategories.length} electronics categories:`);
    
    insertedCategories.forEach(category => {
      console.log(`- ${category.name} (ID: ${category._id})`);
    });

    console.log('Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

clearAndSeedCategories();
