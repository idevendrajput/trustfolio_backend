const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Category title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Category image is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  priceRange: {
    min: {
      type: Number,
      required: [true, 'Minimum price range is required'],
      default: 500
    },
    max: {
      type: Number,
      required: [true, 'Maximum price range is required'],
      default: 100000
    },
    step: {
      type: Number,
      default: 2000,
      min: [1000, 'Step should be at least 1000']
    }
  },
  searchKeywords: [{
    type: String,
    trim: true
  }],
  lastScraped: {
    type: Date,
    default: null
  },
  scrapingStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Create slug from name before saving
categorySchema.pre('save', function(next) {
  if ((this.isModified('name') || this.isNew) && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Indexes for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ created_at: -1 });

module.exports = mongoose.model('Category', categorySchema);
