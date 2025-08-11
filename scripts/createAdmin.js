#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'trustfolio'
    });
    console.log('Connected to MongoDB successfully');

    // Check if any admin exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('Admin already exists in the system:');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create super admin
    const adminData = {
      name: 'Super Admin',
      email: 'admin@trustfolio.com',
      password: 'admin123', // Change this in production
      role: 'super_admin',
      permissions: [
        'read_products', 
        'write_products', 
        'delete_products',
        'read_categories', 
        'write_categories', 
        'delete_categories',
        'manage_admins',
        'system_settings'
      ],
      isActive: true
    };

    console.log('Creating initial super admin...');
    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Super admin created successfully!');
    console.log('=================================');
    console.log('Email:', admin.email);
    console.log('Password:', 'admin123');
    console.log('Role:', admin.role);
    console.log('=================================');
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    
    if (error.code === 11000) {
      console.log('Admin with this email already exists');
    }
    
    process.exit(1);
  }
}

// Command line options
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node scripts/createAdmin.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  MONGODB_URI    MongoDB connection string
  DB_NAME        Database name (default: trustfolio)

This script creates an initial super admin user if none exists.
Default credentials:
  Email: admin@trustfolio.com
  Password: admin123
  `);
  process.exit(0);
}

// Run the script
createAdmin();
