# 🛒 Amazon Products Scraping System with Oxylabs

## 🚀 System Overview

A comprehensive system for scraping Amazon products using Oxylabs API, storing structured data, and providing APIs for product retrieval with dynamic price range processing.

### Key Features:
- ✅ **Dynamic Price Ranges**: Each category has configurable min/max prices and step intervals
- ✅ **Oxylabs Integration**: Professional-grade Amazon scraping with 99%+ success rate
- ✅ **Structured Data**: Clean, normalized product information storage
- ✅ **Auto-Scheduling**: Daily updates with cron jobs
- ✅ **Quality Assessment**: AI-based product quality scoring
- ✅ **Complete APIs**: Public and admin endpoints for all operations

---

## 📊 Database Structure

### Categories Collection
```javascript
{
  name: "Mobiles",
  slug: "mobiles", 
  title: "Latest Smartphones",
  description: "Find the best smartphones within your budget",
  image: "https://...",
  priceRange: {
    min: 1000,      // Minimum price in INR
    max: 250000,    // Maximum price in INR  
    step: 2000      // Price increment step
  },
  searchKeywords: ["smartphone", "mobile phone", "android"],
  scrapingStatus: "pending", // pending, in_progress, completed, failed
  lastScraped: Date,
  isActive: true,
  sortOrder: 1
}
```

### Products Collection
```javascript
{
  asin: "B08XYZ123A",           // Amazon Standard Identification Number
  title: "Product Title",
  brand: "Brand Name",
  category: ObjectId,
  categoryName: "Mobiles",
  
  pricing: {
    current: 15999,
    original: 19999,
    discount: { amount: 4000, percentage: 20 },
    currency: "INR"
  },
  
  rating: {
    average: 4.2,
    totalReviews: 1543
  },
  
  images: [{
    url: "https://...",
    alt: "Product image",
    isPrimary: true
  }],
  
  availability: {
    status: "in_stock",
    deliveryInfo: "Free delivery"
  },
  
  scrapingInfo: {
    scrapedAt: Date,
    source: "oxylabs",
    searchQuery: "mobiles",
    priceRangeQueried: { min: 14000, max: 16000 }
  },
  
  quality: "high" // high, medium, low
}
```

---

## 🔧 Configuration

### Oxylabs Credentials
```env
OXYLABS_USERNAME=idevendra
OXYLABS_PASSWORD=Sy4Y9Kh3+wNDrR=
OXYLABS_ENDPOINT=realtime.oxylabs.io
```

### Sample Category Configurations
| Category | Min Price | Max Price | Step | Expected Ranges |
|----------|-----------|-----------|------|-----------------|
| Mobiles | ₹1,000 | ₹2,50,000 | ₹2,000 | 125 ranges |
| Laptops | ₹20,000 | ₹5,00,000 | ₹5,000 | 96 ranges |
| Headphones | ₹200 | ₹50,000 | ₹1,000 | 50 ranges |
| Air Conditioners | ₹15,000 | ₹2,00,000 | ₹5,000 | 37 ranges |

---

## 🛠️ API Endpoints

### 🌐 Public Endpoints

#### Get Categories
```http
GET /api/categories
```
Home page categories with images

#### Get Products 
```http
GET /api/products?category=mobiles&minPrice=10000&maxPrice=50000&limit=20
```

#### Get Products by Category
```http
GET /api/products/category/mobiles?page=1&limit=20&sort=-rating.average
```

#### Search Products
```http
GET /api/products/search?q=smartphone&minPrice=15000&maxPrice=25000
```

#### Get Single Product
```http
GET /api/products/:id    // By ObjectId or ASIN
```

### 🔐 Admin Endpoints (Requires Authentication)

#### Start Complete Scraping
```http
POST /api/products/scraping/start
Authorization: Bearer <admin-token>

{
  "limit": 20  // Products per price range (optional)
}
```

#### Scrape Specific Category
```http
POST /api/products/scraping/category/:categoryId  
Authorization: Bearer <admin-token>

{
  "limit": 15  // Optional
}
```

#### Get Scraping Status
```http
GET /api/products/scraping/status
Authorization: Bearer <admin-token>
```

#### Stop Scraping
```http
POST /api/products/scraping/stop
Authorization: Bearer <admin-token>
```

#### Get Product Statistics
```http
GET /api/products/admin/stats
Authorization: Bearer <admin-token>
```

---

## 🚀 How It Works

### 1. **Dynamic Price Range Generation**
```javascript
// For Mobiles: ₹1,000 to ₹2,50,000 with ₹2,000 step
[
  { min: 1000, max: 2999 },
  { min: 3000, max: 4999 },  
  { min: 5000, max: 6999 },
  // ... continues to 250000
]
```

### 2. **Oxylabs API Integration**
```javascript
// Search products in price range
const payload = {
  source: 'amazon_search',
  domain: 'amazon.in', 
  query: 'mobiles smartphone',
  context: [
    { key: 'max_price', value: '15000' }
  ]
};

const response = await oxylabs.makeRequest(payload);
```

### 3. **Data Processing Pipeline**
1. **Raw Data Extraction**: Title, price, rating, images, ASIN
2. **Data Validation**: Check for required fields
3. **Quality Assessment**: 70+ score = high, 40+ = medium, <40 = low
4. **Database Storage**: Upsert products with latest data
5. **Status Updates**: Track scraping progress

### 4. **Quality Scoring Algorithm**
```javascript
// Rating (40% weight)
if (rating >= 4.0 && reviews >= 100) score += 40;
else if (rating >= 3.5 && reviews >= 50) score += 30;

// Images (20% weight) 
if (images.length >= 3) score += 20;

// Title quality (20% weight)
if (title.length >= 50) score += 20;

// Brand presence (10% weight)
if (brand) score += 10;

// Features (10% weight)
if (features.length > 0) score += 10;
```

---

## 📅 Automated Scheduling

### Daily Updates (Cron Jobs)
```javascript
const cron = require('node-cron');

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Starting daily product update...');
  await productScrapingService.startScraping();
});
```

### Weekend Deep Clean
```javascript
// Clean old products every Sunday at 3 AM  
cron.schedule('0 3 * * 0', async () => {
  await productScrapingService.cleanOldProducts(30); // Remove 30+ day old products
});
```

---

## 🎯 Testing & Usage

### 1. **Setup Categories**
```bash
node scripts/createSampleCategories.js
```

### 2. **Test Single Category Scraping**
```bash
# Start server
npm run dev

# Test API (get categories first)
curl http://localhost:3001/api/categories

# Start scraping for specific category (requires admin token)
curl -X POST http://localhost:3001/api/products/scraping/category/CATEGORY_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

### 3. **Monitor Progress**
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3001/api/products/scraping/status
```

### 4. **View Results**
```bash
curl http://localhost:3001/api/products?category=mobiles&limit=5
```

---

## 🔍 Advanced Features

### 1. **Price Range Filtering**
```javascript
// Get products in specific budget
GET /api/products/category/mobiles?minPrice=15000&maxPrice=25000
```

### 2. **Quality-Based Filtering** 
```javascript
// Get only high-quality products
GET /api/products/category/laptops?quality=high
```

### 3. **Multi-Field Search**
```javascript
// Text search with filters
GET /api/products/search?q=gaming laptop&minPrice=50000&category=laptops
```

### 4. **Detailed Analytics**
```javascript
// Category-wise stats
{
  "overview": {
    "totalProducts": 15420,
    "activeProducts": 14987,
    "averagePrice": 28543.50,
    "averageRating": 4.1,
    "totalCategories": 8
  },
  "topCategories": [
    { "_id": "Mobiles", "count": 5234, "avgPrice": 18450 },
    { "_id": "Laptops", "count": 3421, "avgPrice": 65230 }
  ]
}
```

---

## ⚡ Performance Optimizations

### 1. **Rate Limiting**
- 3 seconds delay between price ranges
- 2 seconds delay between categories  
- 500ms delay between individual products

### 2. **Database Indexing**
```javascript
// Compound indexes for fast queries
{ categoryName: 1, 'pricing.current': 1 }
{ categoryName: 1, 'rating.average': -1 }
{ 'pricing.current': 1, 'rating.average': -1 }
```

### 3. **Data Caching**
- Text search indexes on title, brand, description
- Selective field projection for list APIs
- Pagination for large result sets

---

## 🛡️ Error Handling & Monitoring

### 1. **Oxylabs API Errors**
- Automatic retry with exponential backoff
- Detailed error logging
- Graceful degradation

### 2. **Data Validation**
- Required field checks
- Price validation
- Image URL validation
- ASIN format validation

### 3. **System Monitoring**
```javascript
{
  isRunning: false,
  stats: {
    totalProcessed: 1250,
    totalSaved: 1186,
    totalErrors: 64,
    startTime: "2025-01-20T10:30:00.000Z"
  }
}
```

---

## 🚀 Production Deployment

### 1. **Environment Setup**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
OXYLABS_USERNAME=idevendra  
OXYLABS_PASSWORD=Sy4Y9Kh3+wNDrR=
JWT_SECRET=super_secure_secret
```

### 2. **Process Management**
```bash
# Using PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 3. **Monitoring Setup**
- CloudWatch/DataDog for system metrics
- Database performance monitoring
- API response time tracking
- Oxylabs quota monitoring

---

## 📈 Future Enhancements

1. **Multi-Platform Support**: Flipkart, Snapdeal integration
2. **Price Alerts**: User notifications for price drops
3. **ML Recommendations**: Personalized product suggestions  
4. **Image Recognition**: Product image analysis
5. **Real-time Updates**: WebSocket for live price changes
6. **Bulk Export**: CSV/Excel product exports
7. **Advanced Filters**: Brand, rating, discount percentage
8. **Wishlist System**: User product bookmarking

This system provides a robust, scalable solution for Amazon product scraping with complete API coverage for both public consumption and admin management! 🎯
