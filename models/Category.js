const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  searchKeywords: [{
    type: String,
    trim: true
  }],
  
  // Price ranges for this category
  priceRanges: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    query: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Scraping configuration
  scrapingConfig: {
    maxProductsPerRange: {
      type: Number,
      default: 20
    },
    maxPages: {
      type: Number,
      default: 2
    },
    lastScraped: Date,
    scrapingStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ created_at: -1 });

module.exports = mongoose.model('Category', categorySchema);
