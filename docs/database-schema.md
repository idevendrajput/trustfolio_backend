# Database Schema

This document describes the MongoDB collections and their schemas used in the Trustfolio Backend API.

## Database Information

- **Database Type**: MongoDB
- **ODM**: Mongoose
- **Database Name**: `trustfolio`
- **Connection**: MongoDB Atlas / Local MongoDB

## Collections Overview

| Collection | Description | Model File |
|------------|-------------|------------|
| `users` | User accounts and authentication | `models/User.js` |
| `categories` | Product categories and platform links | `models/Category.js` |

---

## Users Collection

Stores user account information, authentication data, and profile details.

### Schema Definition

```javascript
{
  username: String,        // Unique username (3-30 chars)
  email: String,          // Unique email address
  password: String,       // Hashed password (bcrypt)
  firstName: String,      // User's first name (max 50 chars)
  lastName: String,       // User's last name (max 50 chars)
  profileImage: String,   // Profile image URL (optional)
  bio: String,           // User bio (max 500 chars, optional)
  role: String,          // 'user' or 'admin'
  isVerified: Boolean,   // Email verification status
  isActive: Boolean,     // Account status
  createdAt: Date,       // Account creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Field Details

| Field | Type | Required | Unique | Default | Validation |
|-------|------|----------|--------|---------|------------|
| `username` | String | Yes | Yes | - | 3-30 characters, trim |
| `email` | String | Yes | Yes | - | Valid email format, lowercase |
| `password` | String | Yes | No | - | Min 6 characters, hashed with bcrypt |
| `firstName` | String | Yes | No | - | Max 50 characters, trim |
| `lastName` | String | Yes | No | - | Max 50 characters, trim |
| `profileImage` | String | No | No | null | Valid URL format |
| `bio` | String | No | No | - | Max 500 characters |
| `role` | String | No | No | 'user' | Enum: ['user', 'admin'] |
| `isVerified` | Boolean | No | No | false | - |
| `isActive` | Boolean | No | No | true | - |
| `createdAt` | Date | Auto | No | Now | Auto-generated |
| `updatedAt` | Date | Auto | No | Now | Auto-updated |

### Indexes

```javascript
// Performance indexes
{ username: 1 }     // Unique index for username lookup
{ email: 1 }        // Unique index for email lookup
{ role: 1 }         // Index for role-based queries
{ isActive: 1 }     // Index for active user queries
{ createdAt: -1 }   // Index for sorting by creation date
```

### Middleware

#### Pre-save Hook
```javascript
// Password hashing before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

#### Password Comparison Method
```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

#### Virtual Fields
```javascript
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});
```

#### JSON Transform
```javascript
// Remove password from JSON output
toJSON: {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
}
```

### Sample Document

```json
{
  "_id": "650abc123def456789012345",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profileImage": null,
  "bio": null,
  "role": "user",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2023-09-20T10:30:00.000Z",
  "updatedAt": "2023-09-20T10:30:00.000Z"
}
```

---

## Categories Collection

Stores product categories with associated e-commerce platform links and search configurations.

### Schema Definition

```javascript
{
  name: String,           // Category name (unique, 2-50 chars)
  slug: String,          // URL-friendly slug (auto-generated)
  title: String,         // Display title (max 100 chars)
  description: String,   // Category description (max 500 chars)
  image: String,         // Category image URL
  product_links: [{      // Array of platform links
    platform: String,    // Platform name (amazon, flipkart, etc.)
    base_url: String,    // Base search URL
    price_param_config: {
      low_price: String, // Low price parameter name
      high_price: String // High price parameter name
    }
  }],
  created_at: Date,      // Creation timestamp
  updated_at: Date       // Last update timestamp
}
```

### Field Details

| Field | Type | Required | Unique | Default | Validation |
|-------|------|----------|--------|---------|------------|
| `name` | String | Yes | Yes | - | 2-50 characters, trim |
| `slug` | String | No | Yes | Auto | Auto-generated from name |
| `title` | String | Yes | No | - | Max 100 characters, trim |
| `description` | String | No | No | - | Max 500 characters, trim |
| `image` | String | No | No | - | Valid HTTP/HTTPS URL |
| `product_links` | Array | No | No | [] | Array of ProductLink objects |
| `created_at` | Date | Auto | No | Now | Auto-generated |
| `updated_at` | Date | Auto | No | Now | Auto-updated |

### Product Link Sub-Schema

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `platform` | String | Yes | Enum: ['amazon', 'flipkart', 'chroma', 'reliancedigital', 'other'] |
| `base_url` | String | Yes | Valid URL, trim |
| `price_param_config.low_price` | String | Yes | - |
| `price_param_config.high_price` | String | Yes | - |

### Indexes

```javascript
// Performance indexes
{ name: 1 }         // Unique index for name lookup
{ slug: 1 }         // Unique index for slug lookup
{ created_at: -1 }  // Index for sorting by creation date
```

### Middleware

#### Pre-save Hook (Slug Generation)
```javascript
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});
```

### Sample Document

```json
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
```

---

## Supported E-commerce Platforms

| Platform | Enum Value | Description |
|----------|------------|-------------|
| Amazon India | `amazon` | Amazon.in marketplace |
| Flipkart | `flipkart` | Flipkart.com marketplace |
| Croma | `chroma` | Croma.com electronics store |
| Reliance Digital | `reliancedigital` | RelianceDigital.in store |
| Other | `other` | Custom platform |

---

## Data Relationships

### User-Category Relationship

Currently, there are no direct relationships between users and categories. Categories are managed by admin users, and regular users can view all categories.

**Future Enhancements**:
- User favorites/bookmarks for categories
- User-specific category recommendations
- Category usage analytics per user

---

## Database Operations

### Common Queries

#### Users

```javascript
// Find user by email
await User.findOne({ email: 'user@example.com' });

// Find active admin users
await User.find({ role: 'admin', isActive: true });

// Create new user
await User.create({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'hashedPassword',
  firstName: 'John',
  lastName: 'Doe'
});
```

#### Categories

```javascript
// Find all categories with pagination
await Category.find()
  .sort({ created_at: -1 })
  .limit(10)
  .skip(0);

// Find category by slug
await Category.findOne({ slug: 'mobiles' });

// Search categories
await Category.find({
  $or: [
    { name: { $regex: 'mobile', $options: 'i' } },
    { title: { $regex: 'mobile', $options: 'i' } },
    { description: { $regex: 'mobile', $options: 'i' } }
  ]
});

// Add product link to category
await Category.findByIdAndUpdate(
  categoryId,
  { $push: { product_links: newProductLink } },
  { new: true }
);
```

---

## Data Validation

### Mongoose Validation

Both schemas use Mongoose built-in validators:

- **Required fields**: Ensures essential data is present
- **String length**: minlength/maxlength validators
- **Email format**: Built-in email validator
- **Enum values**: Restricts values to predefined options
- **Custom validators**: URL validation, password strength

### Application-Level Validation

Additional validation in controllers:
- Duplicate checking before creation
- Business logic validation
- Cross-field validation
- Platform-specific URL validation

---

## Performance Considerations

### Indexing Strategy

1. **Unique indexes** on frequently queried unique fields
2. **Compound indexes** for multi-field queries
3. **Sort indexes** for pagination and ordering
4. **Text indexes** for search functionality (future)

### Query Optimization

1. **Projection**: Select only needed fields
2. **Pagination**: Limit results with skip/limit
3. **Population**: Efficient joins with populate()
4. **Aggregation**: Complex queries with aggregation pipeline

---

## Data Migration

### Adding New Fields

```javascript
// Migration script example
const addNewFieldToUsers = async () => {
  await User.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: defaultValue } }
  );
};
```

### Schema Changes

1. **Backward compatible**: Add optional fields
2. **Breaking changes**: Version migrations
3. **Data transformation**: Migration scripts
4. **Index management**: Add/remove indexes as needed

---

## Backup and Recovery

### Backup Strategy

```bash
# MongoDB dump
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/trustfolio"

# Specific collection backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/trustfolio" --collection=categories
```

### Data Restoration

```bash
# Restore from dump
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/trustfolio" dump/
```

---

## Security Considerations

1. **Password Storage**: bcrypt hashing with salt rounds
2. **Data Sanitization**: Input validation and sanitization
3. **Access Control**: Role-based permissions
4. **Sensitive Data**: No sensitive data in logs
5. **Connection Security**: TLS/SSL for database connections

This schema is designed to be scalable and maintainable while supporting the current feature set and allowing for future enhancements.
