# Trustfolio Backend API Documentation

Welcome to the Trustfolio Backend API documentation. This API provides comprehensive endpoints for managing categories, user authentication, and product comparison features.

## 📚 Documentation Structure

- **[Getting Started](./getting-started.md)** - Setup and installation guide
- **[Authentication](./api/authentication.md)** - User authentication and authorization
- **[Categories API](./api/categories.md)** - Category management endpoints
- **[Error Handling](./error-handling.md)** - Error codes and handling
- **[Database Schema](./database-schema.md)** - MongoDB collections and models
- **[Deployment](./deployment.md)** - Production deployment guide

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd trustfolio_backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔗 Base URL

```
Development: http://localhost:3001
Production: https://your-domain.com
```

## 📋 Available Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)
- `POST /api/categories/:id/product-links` - Add product link (Admin)
- `DELETE /api/categories/:id/product-links/:platform` - Remove product link (Admin)

## 🔐 Authentication

Most endpoints require authentication using Bearer tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Mongoose built-in validators
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Morgan
- **Development**: Nodemon

## 📈 Features

- ✅ RESTful API design
- ✅ JWT-based authentication
- ✅ Role-based authorization (Admin/User)
- ✅ Input validation and sanitization
- ✅ Error handling and logging
- ✅ Pagination support
- ✅ Search functionality
- ✅ CORS enabled
- ✅ Security headers
- ✅ Request logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: devendra@example.com

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](../LICENSE) file for details.
