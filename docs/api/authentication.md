# Authentication API

The Authentication API handles user registration, login, and user profile management with JWT-based authentication.

## Base URL

```
http://localhost:3001/api/auth
```

## Endpoints Overview

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/me` | Get current user profile | Private |

---

## Register User

Create a new user account.

### Endpoint
```http
POST /api/auth/register
```

### Request Body
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Request Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `username` | String | Yes | Unique username | 3-30 characters |
| `email` | String | Yes | Valid email address | Must be valid email format |
| `password` | String | Yes | User password | Minimum 6 characters |
| `firstName` | String | Yes | User's first name | Maximum 50 characters |
| `lastName` | String | Yes | User's last name | Maximum 50 characters |

### Success Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "650abc123def456789012345",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

#### 400 - User Already Exists
```json
{
  "success": false,
  "message": "User already exists with this email or username"
}
```

#### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Username must be at least 3 characters",
    "Please enter a valid email"
  ]
}
```

### Example Request
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## Login User

Authenticate user and get access token.

### Endpoint
```http
POST /api/auth/login
```

### Request Body
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | String | Yes | User's email address |
| `password` | String | Yes | User's password |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "650abc123def456789012345",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

#### 400 - Missing Credentials
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

#### 401 - Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Example Request
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

---

## Get Current User

Get the profile of the currently authenticated user.

### Endpoint
```http
GET /api/auth/me
```

### Headers
```http
Authorization: Bearer <jwt-token>
```

### Success Response (200)
```json
{
  "success": true,
  "data": {
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
}
```

### Error Responses

#### 401 - No Token
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

#### 401 - Invalid Token
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

### Example Request
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## JWT Token Information

### Token Structure
The JWT token contains the following payload:
```json
{
  "id": "650abc123def456789012345",
  "iat": 1695208200,
  "exp": 1697800200
}
```

### Token Expiry
- **Development**: 30 days
- **Production**: Configure as needed

### Using Tokens
Include the token in the Authorization header for protected routes:
```http
Authorization: Bearer <your-jwt-token>
```

---

## User Roles

The system supports two user roles:

| Role | Description | Capabilities |
|------|-------------|--------------|
| `user` | Regular user | Can access public endpoints, view categories |
| `admin` | Administrator | Full access including create, update, delete operations |

---

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
- **JWT Tokens**: Stateless authentication with configurable expiry
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: (To be implemented)
- **Account Lockout**: (To be implemented)

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation errors |
| 401 | Unauthorized - Authentication failed |
| 403 | Forbidden - Access denied |
| 404 | Not Found - User not found |
| 500 | Internal Server Error |

---

## Testing with Postman

1. **Create a new request collection**
2. **Set base URL**: `http://localhost:3001/api/auth`
3. **Test registration**: POST to `/register`
4. **Test login**: POST to `/login`
5. **Save the token** from login response
6. **Test protected route**: GET to `/me` with Bearer token

### Postman Environment Variables
```json
{
  "base_url": "http://localhost:3001/api",
  "jwt_token": "{{token}}"
}
```

---

## Integration Examples

### Frontend (React/Next.js)
```javascript
// Login function
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    return data.data;
  }
  
  throw new Error(data.message);
};

// Authenticated requests
const fetchProfile = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
```

### Mobile (React Native)
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store token
await AsyncStorage.setItem('token', data.data.token);

// Retrieve token
const token = await AsyncStorage.getItem('token');
```
