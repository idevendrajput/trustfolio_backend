const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Admin schema (simplified for direct creation)
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'super_admin' },
  isActive: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createTestAdmin() {
  try {
    // Connect to Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    
    console.log('Connected to MongoDB Atlas');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'test@trustfolio.com' });
    if (existingAdmin) {
      console.log('Test admin already exists');
      await mongoose.disconnect();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create admin
    const admin = new Admin({
      name: 'Test Admin',
      email: 'test@trustfolio.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true
    });
    
    await admin.save();
    console.log('Test admin created successfully');
    console.log('Email: test@trustfolio.com');
    console.log('Password: password123');
    console.log('Role:', admin.role);
    
    await mongoose.disconnect();
    console.log('Disconnected from database');
    
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createTestAdmin();
