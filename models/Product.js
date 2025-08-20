const mongoose = require('mongoose');

// Product specifications schema (from Amazon product_information)
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

// Product variants schema
const variantSchema = new mongoose.Schema({
  type: String, // color, size, storage, etc.
  value: String,
  asin: String,
  price: Number,
  isAvailable: Boolean,
  image: String
}, { _id: false });

// Rating breakdown schema
const ratingBreakdownSchema = new mongoose.Schema({
  stars: Number,
  count: Number,
  percentage: Number
}, { _id: false });

// Product customization options (color, size, storage variants)
const customizationOptionSchema = new mongoose.Schema({
  type: String, // color, size, storage, etc.
  value: String,
  asin: String,
  image: String,
  url: String,
  isSelected: Boolean
}, { _id: false });

// Customer reviews schema
const customerReviewSchema = new mongoose.Schema({
  customerName: String,
  customerProfile: String,
  thumbnail: String,
  rating: String,
  reviewTitle: String,
  date: String,
  reviewSnippet: String
}, { _id: false });

// Customer sentiments schema
const customerSentimentSchema = new mongoose.Schema({
  title: String,
  sentiment: String // POSITIVE, NEGATIVE, MIXED
}, { _id: false });

// Rating distribution schema
const ratingDistributionSchema = new mongoose.Schema({
  rating: Number,
  distribution: String
}, { _id: false });

// Other sellers schema
const otherSellerSchema = new mongoose.Schema({
  sellerName: String,
  price: String,
  shipping: String,
  rating: String
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
  parentAsin: {
    type: String,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  description: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  brandUrl: {
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
  productCategory: String,
  
  // Images and Media
  mainImage: {
    type: String,
    trim: true
  },
  images: [imageSchema],
  numberOfVideos: {
    type: Number,
    default: 0
  },
  
  // Pricing Information
  pricing: {
    current: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price cannot be negative'],
      index: true
    },
    list: {
      type: Number,
      min: [0, 'List price cannot be negative']
    },
    previous: {
      type: Number,
      min: [0, 'Previous price cannot be negative']
    },
    symbol: {
      type: String,
      default: '₹'
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
      index: true
    }
  },
  
  // Amazon-specific flags
  badges: {
    isPrimeExclusive: {
      type: Boolean,
      default: false,
      index: true
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true
    },
    isAmazonChoice: {
      type: Boolean,
      default: false,
      index: true
    },
    limitedTimeDeal: {
      type: Boolean,
      default: false,
      index: true
    },
    dealOfTheDay: {
      type: Boolean,
      default: false,
      index: true
    },
    isCouponExists: {
      type: Boolean,
      default: false
    },
    couponText: String
  },
  
  // Availability and Purchase Info
  availability: {
    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'limited_stock', 'unknown'],
      default: 'unknown',
      index: true
    },
    numberOfPeopleBought: String,
    shippingInfo: String,
    deliveryInfo: String,
    estimatedDelivery: Date
  },
  
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
    stars: mongoose.Schema.Types.Mixed,
    breakdown: [ratingDistributionSchema]
  },
  
  // Product Details
  featureBullets: [String],
  productInformation: mongoose.Schema.Types.Mixed,
  specifications: mongoose.Schema.Types.Mixed,
  customizationOptions: [customizationOptionSchema],
  
  // Merchant/Seller Information
  merchantInfo: mongoose.Schema.Types.Mixed,
  shipsFrom: String,
  soldBy: String,
  merchantId: String,
  location: String,
  
  // URLs
  amazonUrl: {
    type: String,
    required: [true, 'Amazon URL is required'],
    trim: true
  },
  optimizedUrl: {
    type: String,
    trim: true
  },
  
  // Customer Feedback
  customerReviews: [customerReviewSchema],
  ratingsDistribution: [ratingDistributionSchema],
  customersSay: String,
  customerSentiments: [customerSentimentSchema],
  
  // Scraping Metadata
  scrapingInfo: {
    scrapedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: {
      type: String,
      default: 'scrapingdog',
      enum: ['oxylabs', 'scrapingdog', 'manual', 'other']
    },
    searchQuery: String,
    priceRangeQueried: mongoose.Schema.Types.Mixed,
    position: Number,
    syncStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    errorMessage: String,
    lastSyncAt: {
      type: Date,
      index: true
    }
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
    default: 'medium',
    index: true
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
productSchema.index({ 'scrapingInfo.lastSyncAt': 1, 'scrapingInfo.syncStatus': 1 });
productSchema.index({ 'badges.isBestSeller': 1, 'badges.isAmazonChoice': 1 });

// Full text index for search functionality
productSchema.index({
  title: 'text',
  brand: 'text',
  description: 'text',
  keywords: 'text'
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  if (!this.pricing.current) return null;
  return this.pricing.symbol + this.pricing.current.toLocaleString('en-IN');
});

// Virtual for formatted previous price
productSchema.virtual('formattedPreviousPrice').get(function() {
  if (!this.pricing.previous) return null;
  return this.pricing.symbol + this.pricing.previous.toLocaleString('en-IN');
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.pricing.previous || this.pricing.previous <= this.pricing.current) {
    return null;
  }
  return Math.round(((this.pricing.previous - this.pricing.current) / this.pricing.current) * 100);
});

// Virtual for price range string
productSchema.virtual('priceRangeString').get(function() {
  const price = this.pricing.current;
  if (price < 5000) return 'Under ₹5K';
  if (price < 10000) return '₹5K-₹10K';
  if (price < 25000) return '₹10K-₹25K';
  if (price < 50000) return '₹25K-₹50K';
  if (price < 100000) return '₹50K-₹1L';
  return 'Above ₹1L';
});

// Method to generate category-specific specifications
productSchema.methods.getCategorySpecificSpecs = function() {
  if (!this.specifications) return {};

  const categoryName = this.categoryName ? this.categoryName.toLowerCase() : '';
  
  const specMappings = {
    'earbuds': {
      'driver_size': 'Driver Size',
      'battery_life': 'Battery Life', 
      'noise_cancellation': 'Noise Cancellation',
      'bluetooth_version': 'Bluetooth Version',
      'water_resistance': 'Water Resistance',
      'charging_time': 'Charging Time'
    },
    'tv': {
      'screen_size': 'Screen Size',
      'resolution': 'Resolution',
      'display_type': 'Display Type',
      'refresh_rate': 'Refresh Rate',
      'smart_features': 'Smart Features',
      'connectivity': 'Connectivity',
      'sound_output': 'Sound Output',
      'energy_rating': 'Energy Rating'
    },
    'laptop': {
      'processor': 'Processor',
      'ram': 'RAM',
      'storage': 'Storage',
      'graphics': 'Graphics',
      'display': 'Display',
      'operating_system': 'Operating System',
      'battery': 'Battery',
      'weight': 'Weight'
    },
    'smartphone': {
      'processor': 'Processor',
      'ram': 'RAM',
      'storage': 'Storage',
      'camera': 'Camera',
      'battery': 'Battery',
      'display': 'Display',
      'operating_system': 'Operating System'
    }
  };

  return specMappings[categoryName] || {};
};

// Method to check if product needs sync
productSchema.methods.needsSync = function() {
  if (!this.scrapingInfo.lastSyncAt) return true;
  
  // Sync every 6 hours for active products
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return this.scrapingInfo.lastSyncAt < sixHoursAgo;
};

// Method to mark sync as successful
productSchema.methods.markSyncSuccessful = function() {
  this.scrapingInfo.lastSyncAt = new Date();
  this.scrapingInfo.syncStatus = 'success';
  this.scrapingInfo.errorMessage = null;
  return this.save();
};

// Method to mark sync as failed
productSchema.methods.markSyncFailed = function(error) {
  this.scrapingInfo.lastSyncAt = new Date();
  this.scrapingInfo.syncStatus = 'failed';
  this.scrapingInfo.errorMessage = error;
  return this.save();
};

// Static method to generate price ranges
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

// Method to validate product data
productSchema.methods.validateProductData = function() {
  const errors = [];
  
  if (!this.title || this.title.length < 10) {
    errors.push('Title is too short');
  }
  
  if (!this.pricing.current || this.pricing.current <= 0) {
    errors.push('Invalid price');
  }
  
  if (!this.asin || this.asin.length !== 10) {
    errors.push('Invalid ASIN format');
  }
  
  return errors;
};

// Static method for active products
productSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method for products with deals
productSchema.statics.findWithDeals = function() {
  return this.find({
    $or: [
      { 'badges.limitedTimeDeal': true },
      { 'badges.dealOfTheDay': true },
      { 'badges.isCouponExists': true }
    ]
  });
};

// Static method for highly rated products
productSchema.statics.findHighlyRated = function(minRating = 4.0) {
  return this.find({ 'rating.average': { $gte: minRating } });
};

module.exports = mongoose.model('Product', productSchema);
