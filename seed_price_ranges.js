require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

// Price range configurations for different categories
const categoryPriceRanges = {
  // Smartphones: ₹5,000 - ₹100,000
  'Smartphone': [
    { name: 'under_5k', label: '₹0 - ₹5,000', min: 0, max: 5000, query: 'under 5000' },
    { name: 'under_10k', label: '₹5,000 - ₹10,000', min: 5000, max: 10000, query: 'under 10000' },
    { name: 'under_15k', label: '₹10,000 - ₹15,000', min: 10000, max: 15000, query: 'under 15000' },
    { name: 'under_20k', label: '₹15,000 - ₹20,000', min: 15000, max: 20000, query: 'under 20000' },
    { name: 'under_30k', label: '₹20,000 - ₹30,000', min: 20000, max: 30000, query: 'under 30000' },
    { name: 'under_40k', label: '₹30,000 - ₹40,000', min: 30000, max: 40000, query: 'under 40000' },
    { name: 'under_50k', label: '₹40,000 - ₹50,000', min: 40000, max: 50000, query: 'under 50000' },
    { name: 'under_70k', label: '₹50,000 - ₹70,000', min: 50000, max: 70000, query: 'under 70000' },
    { name: 'under_100k', label: '₹70,000 - ₹100,000', min: 70000, max: 100000, query: 'under 100000' },
    { name: 'above_100k', label: '₹100,000+', min: 100000, max: 200000, query: 'above 100000' }
  ],

  // Laptops: ₹15,000 - ₹500,000
  'Laptop': [
    { name: 'under_20k', label: '₹15,000 - ₹20,000', min: 15000, max: 20000, query: 'under 20000' },
    { name: 'under_30k', label: '₹20,000 - ₹30,000', min: 20000, max: 30000, query: 'under 30000' },
    { name: 'under_40k', label: '₹30,000 - ₹40,000', min: 30000, max: 40000, query: 'under 40000' },
    { name: 'under_50k', label: '₹40,000 - ₹50,000', min: 40000, max: 50000, query: 'under 50000' },
    { name: 'under_70k', label: '₹50,000 - ₹70,000', min: 50000, max: 70000, query: 'under 70000' },
    { name: 'under_100k', label: '₹70,000 - ₹1,00,000', min: 70000, max: 100000, query: 'under 100000' },
    { name: 'under_150k', label: '₹1,00,000 - ₹1,50,000', min: 100000, max: 150000, query: 'under 150000' },
    { name: 'under_200k', label: '₹1,50,000 - ₹2,00,000', min: 150000, max: 200000, query: 'under 200000' },
    { name: 'under_300k', label: '₹2,00,000 - ₹3,00,000', min: 200000, max: 300000, query: 'under 300000' },
    { name: 'above_300k', label: '₹3,00,000+', min: 300000, max: 500000, query: 'above 300000' }
  ],

  // Headphones/Earbuds: ₹100 - ₹100,000
  'Headphones': [
    { name: 'under_500', label: '₹100 - ₹500', min: 100, max: 500, query: 'under 500' },
    { name: 'under_1k', label: '₹500 - ₹1,000', min: 500, max: 1000, query: 'under 1000' },
    { name: 'under_2k', label: '₹1,000 - ₹2,000', min: 1000, max: 2000, query: 'under 2000' },
    { name: 'under_3k', label: '₹2,000 - ₹3,000', min: 2000, max: 3000, query: 'under 3000' },
    { name: 'under_5k', label: '₹3,000 - ₹5,000', min: 3000, max: 5000, query: 'under 5000' },
    { name: 'under_10k', label: '₹5,000 - ₹10,000', min: 5000, max: 10000, query: 'under 10000' },
    { name: 'under_20k', label: '₹10,000 - ₹20,000', min: 10000, max: 20000, query: 'under 20000' },
    { name: 'under_30k', label: '₹20,000 - ₹30,000', min: 20000, max: 30000, query: 'under 30000' },
    { name: 'under_50k', label: '₹30,000 - ₹50,000', min: 30000, max: 50000, query: 'under 50000' },
    { name: 'above_50k', label: '₹50,000+', min: 50000, max: 100000, query: 'above 50000' }
  ],

  // Television: ₹8,000 - ₹500,000
  'Television': [
    { name: 'under_10k', label: '₹8,000 - ₹10,000', min: 8000, max: 10000, query: 'under 10000' },
    { name: 'under_15k', label: '₹10,000 - ₹15,000', min: 10000, max: 15000, query: 'under 15000' },
    { name: 'under_25k', label: '₹15,000 - ₹25,000', min: 15000, max: 25000, query: 'under 25000' },
    { name: 'under_40k', label: '₹25,000 - ₹40,000', min: 25000, max: 40000, query: 'under 40000' },
    { name: 'under_60k', label: '₹40,000 - ₹60,000', min: 40000, max: 60000, query: 'under 60000' },
    { name: 'under_80k', label: '₹60,000 - ₹80,000', min: 60000, max: 80000, query: 'under 80000' },
    { name: 'under_100k', label: '₹80,000 - ₹1,00,000', min: 80000, max: 100000, query: 'under 100000' },
    { name: 'under_150k', label: '₹1,00,000 - ₹1,50,000', min: 100000, max: 150000, query: 'under 150000' },
    { name: 'under_250k', label: '₹1,50,000 - ₹2,50,000', min: 150000, max: 250000, query: 'under 250000' },
    { name: 'above_250k', label: '₹2,50,000+', min: 250000, max: 500000, query: 'above 250000' }
  ],

  // Air Conditioner: ₹20,000 - ₹200,000
  'Air Conditioner': [
    { name: 'under_25k', label: '₹20,000 - ₹25,000', min: 20000, max: 25000, query: 'under 25000' },
    { name: 'under_30k', label: '₹25,000 - ₹30,000', min: 25000, max: 30000, query: 'under 30000' },
    { name: 'under_35k', label: '₹30,000 - ₹35,000', min: 30000, max: 35000, query: 'under 35000' },
    { name: 'under_40k', label: '₹35,000 - ₹40,000', min: 35000, max: 40000, query: 'under 40000' },
    { name: 'under_50k', label: '₹40,000 - ₹50,000', min: 40000, max: 50000, query: 'under 50000' },
    { name: 'under_60k', label: '₹50,000 - ₹60,000', min: 50000, max: 60000, query: 'under 60000' },
    { name: 'under_80k', label: '₹60,000 - ₹80,000', min: 60000, max: 80000, query: 'under 80000' },
    { name: 'under_100k', label: '₹80,000 - ₹1,00,000', min: 80000, max: 100000, query: 'under 100000' },
    { name: 'under_150k', label: '₹1,00,000 - ₹1,50,000', min: 100000, max: 150000, query: 'under 150000' },
    { name: 'above_150k', label: '₹1,50,000+', min: 150000, max: 200000, query: 'above 150000' }
  ],

  // Refrigerator: ₹12,000 - ₹150,000
  'Refrigerator': [
    { name: 'under_15k', label: '₹12,000 - ₹15,000', min: 12000, max: 15000, query: 'under 15000' },
    { name: 'under_20k', label: '₹15,000 - ₹20,000', min: 15000, max: 20000, query: 'under 20000' },
    { name: 'under_25k', label: '₹20,000 - ₹25,000', min: 20000, max: 25000, query: 'under 25000' },
    { name: 'under_30k', label: '₹25,000 - ₹30,000', min: 25000, max: 30000, query: 'under 30000' },
    { name: 'under_40k', label: '₹30,000 - ₹40,000', min: 30000, max: 40000, query: 'under 40000' },
    { name: 'under_50k', label: '₹40,000 - ₹50,000', min: 40000, max: 50000, query: 'under 50000' },
    { name: 'under_70k', label: '₹50,000 - ₹70,000', min: 50000, max: 70000, query: 'under 70000' },
    { name: 'under_100k', label: '₹70,000 - ₹1,00,000', min: 70000, max: 100000, query: 'under 100000' },
    { name: 'under_120k', label: '₹1,00,000 - ₹1,20,000', min: 100000, max: 120000, query: 'under 120000' },
    { name: 'above_120k', label: '₹1,20,000+', min: 120000, max: 150000, query: 'above 120000' }
  ],

  // Washing Machine: ₹8,000 - ₹80,000
  'Washing Machine': [
    { name: 'under_10k', label: '₹8,000 - ₹10,000', min: 8000, max: 10000, query: 'under 10000' },
    { name: 'under_15k', label: '₹10,000 - ₹15,000', min: 10000, max: 15000, query: 'under 15000' },
    { name: 'under_20k', label: '₹15,000 - ₹20,000', min: 15000, max: 20000, query: 'under 20000' },
    { name: 'under_25k', label: '₹20,000 - ₹25,000', min: 20000, max: 25000, query: 'under 25000' },
    { name: 'under_30k', label: '₹25,000 - ₹30,000', min: 25000, max: 30000, query: 'under 30000' },
    { name: 'under_35k', label: '₹30,000 - ₹35,000', min: 30000, max: 35000, query: 'under 35000' },
    { name: 'under_45k', label: '₹35,000 - ₹45,000', min: 35000, max: 45000, query: 'under 45000' },
    { name: 'under_55k', label: '₹45,000 - ₹55,000', min: 45000, max: 55000, query: 'under 55000' },
    { name: 'under_70k', label: '₹55,000 - ₹70,000', min: 55000, max: 70000, query: 'under 70000' },
    { name: 'above_70k', label: '₹70,000+', min: 70000, max: 80000, query: 'above 70000' }
  ],

  // Camera: ₹5,000 - ₹500,000
  'Camera': [
    { name: 'under_10k', label: '₹5,000 - ₹10,000', min: 5000, max: 10000, query: 'under 10000' },
    { name: 'under_20k', label: '₹10,000 - ₹20,000', min: 10000, max: 20000, query: 'under 20000' },
    { name: 'under_30k', label: '₹20,000 - ₹30,000', min: 20000, max: 30000, query: 'under 30000' },
    { name: 'under_50k', label: '₹30,000 - ₹50,000', min: 30000, max: 50000, query: 'under 50000' },
    { name: 'under_80k', label: '₹50,000 - ₹80,000', min: 50000, max: 80000, query: 'under 80000' },
    { name: 'under_120k', label: '₹80,000 - ₹1,20,000', min: 80000, max: 120000, query: 'under 120000' },
    { name: 'under_200k', label: '₹1,20,000 - ₹2,00,000', min: 120000, max: 200000, query: 'under 200000' },
    { name: 'under_300k', label: '₹2,00,000 - ₹3,00,000', min: 200000, max: 300000, query: 'under 300000' },
    { name: 'under_400k', label: '₹3,00,000 - ₹4,00,000', min: 300000, max: 400000, query: 'under 400000' },
    { name: 'above_400k', label: '₹4,00,000+', min: 400000, max: 500000, query: 'above 400000' }
  ],

  // Gaming Console: ₹8,000 - ₹100,000
  'Gaming Console': [
    { name: 'under_10k', label: '₹8,000 - ₹10,000', min: 8000, max: 10000, query: 'under 10000' },
    { name: 'under_15k', label: '₹10,000 - ₹15,000', min: 10000, max: 15000, query: 'under 15000' },
    { name: 'under_25k', label: '₹15,000 - ₹25,000', min: 15000, max: 25000, query: 'under 25000' },
    { name: 'under_35k', label: '₹25,000 - ₹35,000', min: 25000, max: 35000, query: 'under 35000' },
    { name: 'under_45k', label: '₹35,000 - ₹45,000', min: 35000, max: 45000, query: 'under 45000' },
    { name: 'under_55k', label: '₹45,000 - ₹55,000', min: 45000, max: 55000, query: 'under 55000' },
    { name: 'under_70k', label: '₹55,000 - ₹70,000', min: 55000, max: 70000, query: 'under 70000' },
    { name: 'under_80k', label: '₹70,000 - ₹80,000', min: 70000, max: 80000, query: 'under 80000' },
    { name: 'under_90k', label: '₹80,000 - ₹90,000', min: 80000, max: 90000, query: 'under 90000' },
    { name: 'above_90k', label: '₹90,000+', min: 90000, max: 100000, query: 'above 90000' }
  ],

  // Tablet: ₹3,000 - ₹150,000
  'Tablet': [
    { name: 'under_5k', label: '₹3,000 - ₹5,000', min: 3000, max: 5000, query: 'under 5000' },
    { name: 'under_8k', label: '₹5,000 - ₹8,000', min: 5000, max: 8000, query: 'under 8000' },
    { name: 'under_12k', label: '₹8,000 - ₹12,000', min: 8000, max: 12000, query: 'under 12000' },
    { name: 'under_18k', label: '₹12,000 - ₹18,000', min: 12000, max: 18000, query: 'under 18000' },
    { name: 'under_25k', label: '₹18,000 - ₹25,000', min: 18000, max: 25000, query: 'under 25000' },
    { name: 'under_35k', label: '₹25,000 - ₹35,000', min: 25000, max: 35000, query: 'under 35000' },
    { name: 'under_50k', label: '₹35,000 - ₹50,000', min: 35000, max: 50000, query: 'under 50000' },
    { name: 'under_80k', label: '₹50,000 - ₹80,000', min: 50000, max: 80000, query: 'under 80000' },
    { name: 'under_120k', label: '₹80,000 - ₹1,20,000', min: 80000, max: 120000, query: 'under 120000' },
    { name: 'above_120k', label: '₹1,20,000+', min: 120000, max: 150000, query: 'above 120000' }
  ],

  // Smartwatch: ₹1,000 - ₹100,000
  'Smartwatch': [
    { name: 'under_2k', label: '₹1,000 - ₹2,000', min: 1000, max: 2000, query: 'under 2000' },
    { name: 'under_3k', label: '₹2,000 - ₹3,000', min: 2000, max: 3000, query: 'under 3000' },
    { name: 'under_5k', label: '₹3,000 - ₹5,000', min: 3000, max: 5000, query: 'under 5000' },
    { name: 'under_8k', label: '₹5,000 - ₹8,000', min: 5000, max: 8000, query: 'under 8000' },
    { name: 'under_12k', label: '₹8,000 - ₹12,000', min: 8000, max: 12000, query: 'under 12000' },
    { name: 'under_18k', label: '₹12,000 - ₹18,000', min: 12000, max: 18000, query: 'under 18000' },
    { name: 'under_25k', label: '₹18,000 - ₹25,000', min: 18000, max: 25000, query: 'under 25000' },
    { name: 'under_40k', label: '₹25,000 - ₹40,000', min: 25000, max: 40000, query: 'under 40000' },
    { name: 'under_60k', label: '₹40,000 - ₹60,000', min: 40000, max: 60000, query: 'under 60000' },
    { name: 'above_60k', label: '₹60,000+', min: 60000, max: 100000, query: 'above 60000' }
  ],

  // Speaker: ₹500 - ₹100,000
  'Speaker': [
    { name: 'under_1k', label: '₹500 - ₹1,000', min: 500, max: 1000, query: 'under 1000' },
    { name: 'under_2k', label: '₹1,000 - ₹2,000', min: 1000, max: 2000, query: 'under 2000' },
    { name: 'under_3k', label: '₹2,000 - ₹3,000', min: 2000, max: 3000, query: 'under 3000' },
    { name: 'under_5k', label: '₹3,000 - ₹5,000', min: 3000, max: 5000, query: 'under 5000' },
    { name: 'under_8k', label: '₹5,000 - ₹8,000', min: 5000, max: 8000, query: 'under 8000' },
    { name: 'under_12k', label: '₹8,000 - ₹12,000', min: 8000, max: 12000, query: 'under 12000' },
    { name: 'under_20k', label: '₹12,000 - ₹20,000', min: 12000, max: 20000, query: 'under 20000' },
    { name: 'under_35k', label: '₹20,000 - ₹35,000', min: 20000, max: 35000, query: 'under 35000' },
    { name: 'under_60k', label: '₹35,000 - ₹60,000', min: 35000, max: 60000, query: 'under 60000' },
    { name: 'above_60k', label: '₹60,000+', min: 60000, max: 100000, query: 'above 60000' }
  ]
};

async function seedPriceRanges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    const categories = await Category.find({});
    console.log(`📂 Found ${categories.length} categories to update`);
    
    for (const category of categories) {
      const priceRanges = categoryPriceRanges[category.name];
      
      if (priceRanges) {
        await Category.findByIdAndUpdate(category._id, {
          priceRanges: priceRanges,
          scrapingConfig: {
            maxProductsPerRange: 20,
            maxPages: 2,
            scrapingStatus: 'pending'
          }
        });
        
        console.log(`✅ Updated ${category.name} with ${priceRanges.length} price ranges`);
      } else {
        console.log(`⚠️  No price ranges defined for ${category.name}`);
      }
    }
    
    console.log('\n🎉 Price ranges seeding completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

seedPriceRanges();
