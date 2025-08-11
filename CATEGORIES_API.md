# Categories API - Updated & Simplified

## Overview
Simplified categories system for home page display with images. Platform price parameters and product links have been removed for simplicity.

## Endpoints

### 🌐 Public Endpoints

#### Get All Active Categories (Home Page)
```http
GET /api/categories
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page  
- `search` (string) - Search in name, title, description
- `sort` (string, default: 'sortOrder name') - Sort criteria

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6881c53a573bd65c42b1ea67",
      "name": "Mobiles",
      "slug": "mobiles", 
      "title": "Latest Smartphones",
      "description": "Find the best smartphones within your budget",
      "image": "https://example.com/mobile-category.jpg",
      "sortOrder": 1,
      "created_at": "2025-07-24T05:31:36.997Z",
      "updated_at": "2025-07-24T05:31:36.997Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 15,
    "per_page": 12,
    "has_next": true,
    "has_prev": false
  }
}
```

#### Get Single Category
```http
GET /api/categories/:id
```
- `:id` can be ObjectId or slug
- Returns full category details

---

### 🔐 Admin Endpoints (Authentication Required)

#### Get All Categories (Admin View)
```http
GET /api/categories/admin/all
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page`, `limit`, `search`, `sort` (same as public)
- `status` (string) - 'active', 'inactive', or all

**Response includes:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...},
  "stats": {
    "total": 25,
    "active": 20,
    "inactive": 5
  }
}
```

#### Create Category
```http
POST /api/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Gaming Consoles",
  "title": "Best Gaming Consoles",
  "description": "Find the latest gaming consoles",
  "image": "https://example.com/gaming.jpg",
  "isActive": true,
  "sortOrder": 5
}
```

#### Update Category  
```http
PUT /api/categories/:id
Authorization: Bearer <admin-token>
```

#### Delete Category
```http
DELETE /api/categories/:id
Authorization: Bearer <admin-token>
```

#### Toggle Category Status
```http
PATCH /api/categories/:id/toggle-status
Authorization: Bearer <admin-token>
```

---

## Category Schema

```javascript
{
  name: String,         // Required, unique, 2-50 chars
  slug: String,         // Auto-generated from name
  title: String,        // Required, max 100 chars  
  description: String,  // Optional, max 500 chars
  image: String,        // Required, valid URL
  isActive: Boolean,    // Default: true
  sortOrder: Number,    // Default: 0
  created_at: Date,     // Auto-generated
  updated_at: Date      // Auto-updated
}
```

---

## Key Features

✅ **Simple & Clean**: Removed complex product links and price parameters
✅ **Home Page Ready**: Perfect for displaying categories with images
✅ **Admin Management**: Full CRUD operations with status management
✅ **Search & Filter**: Search functionality across name, title, description
✅ **Pagination**: Built-in pagination support
✅ **Sort Control**: Custom sorting with sortOrder field
✅ **Status Management**: Active/inactive toggle for categories
✅ **SEO Friendly**: Auto-generated slugs for URLs

---

## Usage Examples

### Frontend (React) - Home Page
```javascript
// Fetch categories for home page
const fetchCategories = async () => {
  const response = await fetch('/api/categories?limit=12');
  const data = await response.json();
  return data.data; // Array of active categories with images
};

// Category card component
const CategoryCard = ({ category }) => (
  <div className="category-card">
    <img src={category.image} alt={category.name} />
    <h3>{category.title}</h3>
    <p>{category.description}</p>
  </div>
);
```

### Admin Dashboard
```javascript
// Get all categories for admin
const fetchAllCategories = async (token) => {
  const response = await fetch('/api/categories/admin/all', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

---

## Testing Commands

```bash
# Test public endpoint
curl http://localhost:3001/api/categories

# Test with search
curl "http://localhost:3001/api/categories?search=mobile"

# Test admin endpoint (requires token)
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/categories/admin/all

# Create category (admin)
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptops",
    "title": "Best Laptops 2025", 
    "description": "Find perfect laptops for work and gaming",
    "image": "https://example.com/laptops.jpg"
  }'
```

This simplified system is perfect for home page category display with clean, image-based cards! 🎯
