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
  
  // Sync configuration
  syncEnabled: {
    type: Boolean,
    default: true,
    index: true
  },
  syncFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'manual'],
    default: 'daily'
  },
  maxProducts: {
    type: Number,
    default: 50,
    min: 1,
    max: 1000
  },
  searchQueries: [{
    type: String,
    trim: true
  }],
  
  // Sync tracking
  lastSyncAt: {
    type: Date,
    index: true
  },
  lastSyncStatus: {
    type: String,
    enum: ['pending', 'queued', 'completed', 'failed'],
    default: 'pending'
  },
  lastSyncResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Legacy scraping configuration (keep for compatibility)
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
categorySchema.index({ isActive: 1, syncEnabled: 1 });
categorySchema.index({ sortOrder: 1, name: 1 });
categorySchema.index({ lastSyncAt: 1, lastSyncStatus: 1 });

// Virtual for slug
categorySchema.virtual('slug').get(function() {
  return this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
});

// Virtual for price range summary
categorySchema.virtual('priceRangeSummary').get(function() {
  if (!this.priceRanges || this.priceRanges.length === 0) {
    return null;
  }
  
  const min = Math.min(...this.priceRanges.map(r => r.min));
  const max = Math.max(...this.priceRanges.map(r => r.max));
  return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
});

// Virtual for sync status color
categorySchema.virtual('syncStatusColor').get(function() {
  switch(this.lastSyncStatus) {
    case 'completed': return 'success';
    case 'failed': return 'danger';
    case 'queued': return 'warning';
    case 'pending': return 'info';
    default: return 'secondary';
  }
});

// Virtual for sync results summary
categorySchema.virtual('syncResultsSummary').get(function() {
  if (!this.lastSyncResults) return null;
  
  if (this.lastSyncResults.error) {
    return `Error: ${this.lastSyncResults.error}`;
  }
  
  if (this.lastSyncResults.success !== undefined && this.lastSyncResults.failed !== undefined) {
    return `Success: ${this.lastSyncResults.success}, Failed: ${this.lastSyncResults.failed}`;
  }
  
  return 'Unknown status';
});

// Method to check if category needs sync
categorySchema.methods.needsSync = function() {
  if (!this.syncEnabled || this.syncFrequency === 'manual') {
    return false;
  }
  
  if (!this.lastSyncAt) {
    return true;
  }
  
  const now = new Date();
  const timeDiff = now - this.lastSyncAt;
  
  switch(this.syncFrequency) {
    case 'hourly':
      return timeDiff >= 60 * 60 * 1000; // 1 hour
    case 'daily':
      return timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
    case 'weekly':
      return timeDiff >= 7 * 24 * 60 * 60 * 1000; // 7 days
    default:
      return false;
  }
};

// Static method for active categories
categorySchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static method for sync-enabled categories
categorySchema.statics.findSyncEnabled = function() {
  return this.find({ isActive: true, syncEnabled: true });
};

// Static method for categories needing sync
categorySchema.statics.findNeedingSync = function() {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  return this.find({
    isActive: true,
    syncEnabled: true,
    $or: [
      { lastSyncAt: null },
      { syncFrequency: 'hourly', lastSyncAt: { $lt: oneHourAgo } },
      { syncFrequency: 'daily', lastSyncAt: { $lt: oneDayAgo } },
      { syncFrequency: 'weekly', lastSyncAt: { $lt: oneWeekAgo } }
    ]
  });
};

module.exports = mongoose.model('Category', categorySchema);
