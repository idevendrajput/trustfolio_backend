const mongoose = require('mongoose');
require('dotenv').config();

const cleanProductsCollection = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'trustfolio'
    });
    
    console.log('✅ MongoDB Connected Successfully');
    
    // Get database instance
    const db = mongoose.connection.db;
    
    // Check if products collection exists
    const collections = await db.listCollections({ name: 'products' }).toArray();
    
    if (collections.length > 0) {
      console.log('🗑️  Dropping existing products collection...');
      await db.collection('products').drop();
      console.log('✅ Products collection dropped successfully');
    } else {
      console.log('ℹ️  No existing products collection found');
    }
    
    // Also clean any existing indexes
    console.log('🔧 Collection cleaned and ready for new structure');
    
  } catch (error) {
    console.error('❌ Error cleaning products collection:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

cleanProductsCollection();
