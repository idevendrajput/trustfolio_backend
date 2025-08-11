# Categories API

The Categories API provides comprehensive CRUD operations for managing product categories and their associated platform links.

## Base URL

```
http://localhost:3001/api/categories
```

## Endpoints Overview

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all categories with pagination | Public |
| GET | `/:id` | Get single category by ID or slug | Public |
| POST | `/` | Create new category | Admin |
| PUT | `/:id` | Update category | Admin |
| DELETE | `/:id` | Delete category | Admin |
| POST | `/:id/product-links` | Add product link to category | Admin |
| DELETE | `/:id/product-links/:platform` | Remove product link from category | Admin |

---

## Get All Categories

Retrieve a paginated list of all categories with optional search and sorting.

### Endpoint
```http
GET /api/categories
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Number | No | 1 | Page number for pagination |
| `limit` | Number | No | 10 | Number of items per page |
| `search` | String | No | - | Search in name, title, or description |
| `sort` | String | No | -created_at | Sort field (prefix with - for desc) |

### Example Requests
```bash
# Get all categories (default pagination)
curl http://localhost:3001/api/categories

# Get categories with pagination
curl "http://localhost:3001/api/categories?page=2&limit=5"

# Search categories
curl "http://localhost:3001/api/categories?search=mobile"

# Sort by name ascending
curl "http://localhost:3001/api/categories?sort=name"
```

### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "6881c53a573bd65c42b1ea67",
      "name": "Mobiles",
      "slug": "mobiles",
      "title": "Latest Smartphones",
      "description": "Find the best smartphones within your budget from top brands",
      "image": "https://example.com/mobile-category.jpg",
      "product_links": [
        {
          "platform": "amazon",
          "base_url": "https://www.amazon.in/s?k=mobile...",
          "price_param_config": {
            "low_price": "low-price",
            "high_price": "high-price"
          }
        }
      ],
      "created_at": "2025-07-24T05:31:36.997Z",
      "updated_at": "2025-07-24T05:31:36.997Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 25,
    "per_page": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Get Single Category

Retrieve a specific category by its ID or slug.

### Endpoint
```http
GET /api/categories/:id
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Category ID (ObjectId) or slug |

### Example Requests
```bash
# Get by ID
curl http://localhost:3001/api/categories/6881c53a573bd65c42b1ea67

# Get by slug
curl http://localhost:3001/api/categories/mobiles
```

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "6881c53a573bd65c42b1ea67",
    "name": "Mobiles",
    "slug": "mobiles",
    "title": "Latest Smartphones",
    "description": "Find the best smartphones within your budget from top brands",
    "image": "https://example.com/mobile-category.jpg",
    "product_links": [
      {
        "platform": "amazon",
        "base_url": "https://www.amazon.in/s?k=mobile&crid=17T6CQM6S0XQY",
        "price_param_config": {
          "low_price": "low-price",
          "high_price": "high-price"
        }
      },
      {
        "platform": "flipkart",
        "base_url": "https://www.flipkart.com/search?q=mobile",
        "price_param_config": {
          "low_price": "p%5B%5D=facets.price_range.from%3D",
          "high_price": "p%5B%5D=facets.price_range.to%3D"
        }
      }
    ],
    "created_at": "2025-07-24T05:31:36.997Z",
    "updated_at": "2025-07-24T05:31:36.997Z"
  }
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Category not found"
}
```

---

## Create Category

Create a new category. Requires admin authentication.

### Endpoint
```http
POST /api/categories
```

### Headers
```http
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### Request Body
```json
{
  "name": "Gaming Consoles",
  "title": "Latest Gaming Consoles",
  "description": "Find the best gaming consoles and accessories",
  "image": "https://example.com/gaming-category.jpg",
  "product_links": [
    {
      "platform": "amazon",
      "base_url": "https://www.amazon.in/s?k=gaming+console",
      "price_param_config": {
        "low_price": "low-price",
        "high_price": "high-price"
      }
    }
  ]
}
```

### Request Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | String | Yes | Category name | 2-50 characters, unique |
| `title` | String | Yes | Display title | Max 100 characters |
| `description` | String | No | Category description | Max 500 characters |
| `image` | String | No | Image URL | Valid HTTP/HTTPS URL |
| `product_links` | Array | No | Platform links | Array of product link objects |

#### Product Link Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | String | Yes | Platform name (amazon, flipkart, etc.) |
| `base_url` | String | Yes | Base search URL |
| `price_param_config.low_price` | String | Yes | Low price parameter name |
| `price_param_config.high_price` | String | Yes | High price parameter name |

### Success Response (201)
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "6881c53a573bd65c42b1ea6c",
    "name": "Gaming Consoles",
    "slug": "gaming-consoles",
    "title": "Latest Gaming Consoles",
    "description": "Find the best gaming consoles and accessories",
    "image": "https://example.com/gaming-category.jpg",
    "product_links": [
      {
        "platform": "amazon",
        "base_url": "https://www.amazon.in/s?k=gaming+console",
        "price_param_config": {
          "low_price": "low-price",
          "high_price": "high-price"
        }
      }
    ],
    "created_at": "2025-01-20T10:30:00.000Z",
    "updated_at": "2025-01-20T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 - Category Already Exists
```json
{
  "success": false,
  "message": "Category with this name already exists"
}
```

#### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Category name is required",
    "Title cannot exceed 100 characters"
  ]
}
```

#### 403 - Access Denied
```json
{
  "success": false,
  "message": "Not authorized as an admin"
}
```

### Example Request
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Consoles",
    "title": "Latest Gaming Consoles",
    "description": "Find the best gaming consoles and accessories",
    "image": "https://example.com/gaming-category.jpg"
  }'
```

---

## Update Category

Update an existing category. Requires admin authentication.

### Endpoint
```http
PUT /api/categories/:id
```

### Headers
```http
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Category ID (ObjectId) |

### Request Body
```json
{
  "title": "Best Gaming Consoles 2025",
  "description": "Updated description for gaming consoles",
  "image": "https://example.com/new-gaming-image.jpg"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "6881c53a573bd65c42b1ea6c",
    "name": "Gaming Consoles",
    "slug": "gaming-consoles",
    "title": "Best Gaming Consoles 2025",
    "description": "Updated description for gaming consoles",
    "image": "https://example.com/new-gaming-image.jpg",
    "product_links": [],
    "created_at": "2025-01-20T10:30:00.000Z",
    "updated_at": "2025-01-20T11:45:00.000Z"
  }
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Category not found"
}
```

### Example Request
```bash
curl -X PUT http://localhost:3001/api/categories/6881c53a573bd65c42b1ea6c \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best Gaming Consoles 2025",
    "description": "Updated description for gaming consoles"
  }'
```

---

## Delete Category

Delete a category. Requires admin authentication.

### Endpoint
```http
DELETE /api/categories/:id
```

### Headers
```http
Authorization: Bearer <admin-jwt-token>
```

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Category ID (ObjectId) |

### Success Response (200)
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "deleted_category": {
      "_id": "6881c53a573bd65c42b1ea6c",
      "name": "Gaming Consoles",
      "slug": "gaming-consoles",
      "title": "Best Gaming Consoles 2025"
    }
  }
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Category not found"
}
```

### Example Request
```bash
curl -X DELETE http://localhost:3001/api/categories/6881c53a573bd65c42b1ea6c \
  -H "Authorization: Bearer <admin-token>"
```

---

## Add Product Link

Add a product link to an existing category. Requires admin authentication.

### Endpoint
```http
POST /api/categories/:id/product-links
```

### Headers
```http
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Category ID (ObjectId) |

### Request Body
```json
{
  "platform": "flipkart",
  "base_url": "https://www.flipkart.com/search?q=gaming+console",
  "price_param_config": {
    "low_price": "facets.price_range.from",
    "high_price": "facets.price_range.to"
  }
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Product link added successfully",
  "data": {
    "_id": "6881c53a573bd65c42b1ea6c",
    "name": "Gaming Consoles",
    "product_links": [
      {
        "platform": "amazon",
        "base_url": "https://www.amazon.in/s?k=gaming+console",
        "price_param_config": {
          "low_price": "low-price",
          "high_price": "high-price"
        }
      },
      {
        "platform": "flipkart",
        "base_url": "https://www.flipkart.com/search?q=gaming+console",
        "price_param_config": {
          "low_price": "facets.price_range.from",
          "high_price": "facets.price_range.to"
        }
      }
    ]
  }
}
```

### Error Responses

#### 400 - Platform Already Exists
```json
{
  "success": false,
  "message": "Product link for flipkart already exists"
}
```

#### 400 - Missing Required Fields
```json
{
  "success": false,
  "message": "Platform, base_url, and price_param_config are required"
}
```

### Example Request
```bash
curl -X POST http://localhost:3001/api/categories/6881c53a573bd65c42b1ea6c/product-links \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "flipkart",
    "base_url": "https://www.flipkart.com/search?q=gaming+console",
    "price_param_config": {
      "low_price": "facets.price_range.from",
      "high_price": "facets.price_range.to"
    }
  }'
```

---

## Remove Product Link

Remove a product link from a category. Requires admin authentication.

### Endpoint
```http
DELETE /api/categories/:id/product-links/:platform
```

### Headers
```http
Authorization: Bearer <admin-jwt-token>
```

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Category ID (ObjectId) |
| `platform` | String | Platform name to remove |

### Success Response (200)
```json
{
  "success": true,
  "message": "Product link removed successfully",
  "data": {
    "_id": "6881c53a573bd65c42b1ea6c",
    "name": "Gaming Consoles",
    "product_links": [
      {
        "platform": "amazon",
        "base_url": "https://www.amazon.in/s?k=gaming+console",
        "price_param_config": {
          "low_price": "low-price",
          "high_price": "high-price"
        }
      }
    ]
  }
}
```

### Example Request
```bash
curl -X DELETE http://localhost:3001/api/categories/6881c53a573bd65c42b1ea6c/product-links/flipkart \
  -H "Authorization: Bearer <admin-token>"
```

---

## Supported Platforms

The system supports the following e-commerce platforms:

| Platform | Name | URL Pattern |
|----------|------|-------------|
| `amazon` | Amazon India | amazon.in |
| `flipkart` | Flipkart | flipkart.com |
| `chroma` | Croma | croma.com |
| `reliancedigital` | Reliance Digital | reliancedigital.in |
| `other` | Custom platform | Any URL |

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation errors |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Admin access required |
| 404 | Not Found - Category not found |
| 500 | Internal Server Error |

---

## Testing with Postman

### Environment Variables
```json
{
  "base_url": "http://localhost:3001/api/categories",
  "admin_token": "{{admin_jwt_token}}"
}
```

### Collection Structure
1. **GET All Categories** - `{{base_url}}/`
2. **GET Category by ID** - `{{base_url}}/{{category_id}}`
3. **POST Create Category** - `{{base_url}}/` (with admin token)
4. **PUT Update Category** - `{{base_url}}/{{category_id}}` (with admin token)
5. **DELETE Category** - `{{base_url}}/{{category_id}}` (with admin token)
6. **POST Add Product Link** - `{{base_url}}/{{category_id}}/product-links`
7. **DELETE Remove Product Link** - `{{base_url}}/{{category_id}}/product-links/{{platform}}`

---

## Integration Examples

### Frontend (React)
```javascript
// Fetch all categories
const fetchCategories = async (page = 1, search = '') => {
  const response = await fetch(
    `/api/categories?page=${page}&search=${search}`
  );
  return await response.json();
};

// Create category (admin only)
const createCategory = async (categoryData, token) => {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });
  return await response.json();
};
```

### Mobile App
```javascript
// Get category by slug
const getCategoryBySlug = async (slug) => {
  const response = await fetch(`/api/categories/${slug}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message);
};
```
