const mongoose = require('mongoose');

// Product specifications schema
const specificationSchema = new mongoose.Schema({
  name: String,
  value: String
}, { _id: false });

// Product images schema
const imageSchema = new mongoose.Schema({
  url: String,
  alt: String,
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Product variants schema (size, color, etc.)
const variantSchema = new mongoose.Schema({
  type: String, // color, size, storage, etc.
  value: String,
  price: Number,
  availability: String,
  asin: String
}, { _id: false });

// Rating breakdown schema
const ratingBreakdownSchema = new mongoose.Schema({
  stars: Number,
  percentage: Number,
  count: Number
}, { _id: false });

const productSchema = new mongoose.Schema({
  // Basic Product Information
  asin: {
    type: String,
    required: [true, 'ASIN is required'],
    unique: true,
    uppercase: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  model: {
    type: String,
    trim: true
  },
  
  // Category Information
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  categoryName: {
    type: String,
    required: true,
    index: true
  },
  subcategory: String,
  
  // Pricing Information
  pricing: {
    current: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price cannot be negative'],
      index: true
    },
    original: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    discount: {
      amount: Number,
      percentage: Number
    },
    currency: {
      type: String,
      default: 'INR'
    },
    priceRange: {
      type: String,
      index: true // For grouping by price ranges
    }
  },
  
  // Product URLs and Images
  url: {
    type: String,
    required: [true, 'Product URL is required'],
    trim: true
  },
  images: [imageSchema],
  primaryImage: {
    type: String,
    trim: true
  },
  
  // Product Details
  description: {
    short: String,
    full: String,
    bullets: [String]
  },
  specifications: [specificationSchema],
  variants: [variantSchema],
  
  // Ratings and Reviews
  rating: {
    average: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      index: true
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative'],
      index: true
    },
    breakdown: [ratingBreakdownSchema]
  },
  
  // Availability and Delivery
  availability: {
    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'limited_stock', 'unknown'],
      default: 'unknown',
      index: true
    },
    deliveryInfo: String,
    estimatedDelivery: Date
  },
  
  // Additional Product Information
  features: [String],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: String
  },
  
  // Scraping Metadata
  scrapingInfo: {
    scrapedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: {
      type: String,
      default: 'oxylabs',
      enum: ['oxylabs', 'manual', 'other']
    },
    searchQuery: String,
    priceRangeQueried: {
      min: Number,
      max: Number
    },
    position: Number // Position in search results
  },
  
  // Quality and Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  quality: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  // SEO and Search
  keywords: [String],
  tags: [String]
  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for better performance
productSchema.index({ categoryName: 1, 'pricing.current': 1 });
productSchema.index({ categoryName: 1, 'rating.average': -1 });
productSchema.index({ categoryName: 1, 'rating.totalReviews': -1 });
productSchema.index({ categoryName: 1, 'scrapingInfo.scrapedAt': -1 });
productSchema.index({ 'pricing.current': 1, 'rating.average': -1 });
productSchema.index({ brand: 1, categoryName: 1 });
productSchema.index({ 'availability.status': 1, isActive: 1 });

// Text index for search functionality
productSchema.index({
  title: 'text',
  brand: 'text',
  'description.short': 'text',
  keywords: 'text'
});

// Virtual for price range string
productSchema.virtual('priceRangeString').get(function() {
  const price = this.pricing.current;
  if (price < 5000) return 'Under 5K';
  if (price < 10000) return '5K-10K';
  if (price < 25000) return '10K-25K';
  if (price < 50000) return '25K-50K';
  if (price < 100000) return '50K-1L';
  return 'Above 1L';
});

// Method to generate price range for querying
productSchema.statics.generatePriceRanges = function(min, max, step) {
  const ranges = [];
  for (let i = min; i <= max; i += step) {
    ranges.push({
      min: i,
      max: Math.min(i + step - 1, max)
    });
  }
  return ranges;
};

// Method to clean and validate product data
productSchema.methods.validateProductData = function() {
  const errors = [];
  
  if (!this.title || this.title.length < 10) {
    errors.push('Title is too short');
  }
  
  if (!this.pricing.current || this.pricing.current <= 0) {
    errors.push('Invalid price');
  }
  
  // Temporarily allow products without images for initial data collection
  // if (!this.images || this.images.length === 0) {
  //   errors.push('No images found');
  // }
  
  return errors;
};

module.exports = mongoose.model('Product', productSchema);
