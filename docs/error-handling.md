# Error Handling

This document explains the error handling mechanisms in the Trustfolio Backend API, including error codes, response formats, and troubleshooting guides.

## Error Response Format

All API errors follow a consistent format to ensure predictable error handling on the client side.

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Validation Error Response

For validation errors, additional details are provided:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Username must be at least 3 characters",
    "Email is required",
    "Password must be at least 6 characters"
  ]
}
```

## HTTP Status Codes

### Success Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |

### Client Error Codes

| Code | Status | Description | Common Causes |
|------|--------|-------------|---------------|
| 400 | Bad Request | Invalid request data | Missing fields, invalid data format |
| 401 | Unauthorized | Authentication required | Missing or invalid token |
| 403 | Forbidden | Access denied | Insufficient permissions |
| 404 | Not Found | Resource not found | Invalid ID, deleted resource |
| 409 | Conflict | Resource conflict | Duplicate data, constraint violation |
| 422 | Unprocessable Entity | Validation failed | Business logic validation errors |
| 429 | Too Many Requests | Rate limit exceeded | Too many requests in time window |

### Server Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Error Categories

### 1. Authentication Errors

#### Missing Authentication Token
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

**Solution**: Include Bearer token in Authorization header
```http
Authorization: Bearer <your-jwt-token>
```

#### Invalid/Expired Token
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

**Solutions**:
- Refresh the token
- Re-authenticate the user
- Check token format

#### Insufficient Permissions
```json
{
  "success": false,
  "message": "Not authorized as an admin"
}
```

**Solution**: Ensure user has required role (admin/user)

### 2. Validation Errors

#### Missing Required Fields
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Category name is required",
    "Title is required"
  ]
}
```

#### Invalid Data Format
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Email must be a valid email format",
    "Password must be at least 6 characters"
  ]
}
```

#### Data Length Constraints
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Username cannot exceed 30 characters",
    "Description cannot exceed 500 characters"
  ]
}
```

### 3. Resource Errors

#### Resource Not Found
```json
{
  "success": false,
  "message": "Category not found"
}
```

**Common Causes**:
- Invalid resource ID
- Resource has been deleted
- Typo in ID/slug

#### Duplicate Resource
```json
{
  "success": false,
  "message": "Category with this name already exists"
}
```

**Solution**: Use unique values for constrained fields

### 4. Database Errors

#### Connection Error
```json
{
  "success": false,
  "message": "Database connection error"
}
```

#### Duplicate Key Error
```json
{
  "success": false,
  "message": "Category with this name or slug already exists"
}
```

### 5. Server Errors

#### Internal Server Error
```json
{
  "success": false,
  "message": "Something went wrong!",
  "error": "Detailed stack trace (development only)"
}
```

## Error Handling by Endpoint

### Authentication Endpoints

| Endpoint | Common Errors |
|----------|---------------|
| `POST /api/auth/register` | 400 (validation), 409 (user exists) |
| `POST /api/auth/login` | 400 (missing data), 401 (invalid credentials) |
| `GET /api/auth/me` | 401 (no token), 401 (invalid token) |

### Categories Endpoints

| Endpoint | Common Errors |
|----------|---------------|
| `GET /api/categories` | 500 (server error) |
| `GET /api/categories/:id` | 404 (not found) |
| `POST /api/categories` | 400 (validation), 401 (no auth), 403 (no admin) |
| `PUT /api/categories/:id` | 400 (validation), 401 (no auth), 403 (no admin), 404 (not found) |
| `DELETE /api/categories/:id` | 401 (no auth), 403 (no admin), 404 (not found) |

## Client-Side Error Handling

### JavaScript/React Example

```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const response = await apiFunction();
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  } catch (error) {
    // Handle specific error types
    if (error.status === 401) {
      // Redirect to login or refresh token
      redirectToLogin();
    } else if (error.status === 403) {
      // Show access denied message
      showAccessDeniedMessage();
    } else if (error.status === 422) {
      // Display validation errors
      displayValidationErrors(error.errors);
    } else {
      // Generic error handling
      showErrorMessage(error.message);
    }
    
    throw error;
  }
};

// Usage example
const createCategory = async (categoryData) => {
  return handleApiCall(async () => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(categoryData),
    });
    
    return await response.json();
  });
};
```

### Error State Management (Redux)

```javascript
// Error action types
const ERROR_TYPES = {
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
};

// Error reducer
const errorReducer = (state = {}, action) => {
  switch (action.type) {
    case ERROR_TYPES.AUTHENTICATION_ERROR:
      return {
        ...state,
        auth: action.payload,
      };
    case ERROR_TYPES.VALIDATION_ERROR:
      return {
        ...state,
        validation: action.payload,
      };
    default:
      return state;
  }
};

// Error handling middleware
const errorMiddleware = (store) => (next) => (action) => {
  if (action.error) {
    const { status, message } = action.payload;
    
    switch (status) {
      case 401:
        store.dispatch({
          type: ERROR_TYPES.AUTHENTICATION_ERROR,
          payload: message,
        });
        break;
      case 422:
        store.dispatch({
          type: ERROR_TYPES.VALIDATION_ERROR,
          payload: action.payload.errors,
        });
        break;
      default:
        store.dispatch({
          type: ERROR_TYPES.SERVER_ERROR,
          payload: message,
        });
    }
  }
  
  return next(action);
};
```

## Debugging Guide

### Common Issues and Solutions

#### 1. "Not authorized, no token"

**Check**:
- Token is included in request headers
- Token format is correct (`Bearer <token>`)
- Token is not expired

```bash
# Test with curl
curl -H "Authorization: Bearer <your-token>" http://localhost:3001/api/auth/me
```

#### 2. "Category not found"

**Check**:
- Category ID is correct (24-character hex string for ObjectId)
- Category exists in database
- Using correct endpoint (ID vs slug)

```bash
# Check if category exists
curl http://localhost:3001/api/categories/6881c53a573bd65c42b1ea67
```

#### 3. "Validation error"

**Check**:
- All required fields are present
- Field lengths are within limits
- Data types are correct
- Email format is valid

#### 4. "Database connection error"

**Check**:
- MongoDB URI is correct
- Database is accessible
- Network connectivity
- Database credentials

#### 5. CORS Errors (Browser)

**Check**:
- CORS_ORIGIN environment variable
- Request origin matches allowed origins
- Preflight OPTIONS requests

### Logging and Monitoring

#### Server-Side Logging

```javascript
// Log error details
console.error('API Error:', {
  endpoint: req.originalUrl,
  method: req.method,
  error: error.message,
  stack: error.stack,
  user: req.user?.id,
  timestamp: new Date().toISOString(),
});
```

#### Client-Side Error Tracking

```javascript
// Error tracking service integration
const trackError = (error, context) => {
  // Send to error tracking service (Sentry, LogRocket, etc.)
  errorTrackingService.captureException(error, {
    extra: context,
    user: getCurrentUser(),
    tags: {
      api: true,
      endpoint: context.endpoint,
    },
  });
};
```

## Best Practices

### For Developers

1. **Always check the `success` field** before processing response data
2. **Handle all possible error states** in your application
3. **Provide meaningful error messages** to users
4. **Log errors appropriately** for debugging
5. **Implement retry logic** for transient errors
6. **Validate data on client-side** before sending to API

### For API Consumers

1. **Include proper error handling** in all API calls
2. **Display user-friendly error messages**
3. **Implement proper loading states**
4. **Handle authentication errors gracefully**
5. **Store and retry failed requests** when appropriate

### Error Response Examples by HTTP Status

#### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Name is required", "Email format is invalid"]
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "Not authorized as an admin"
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "message": "Category not found"
}
```

#### 409 - Conflict
```json
{
  "success": false,
  "message": "Category with this name already exists"
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Something went wrong!",
  "error": "Detailed error (development only)"
}
```

## Testing Error Scenarios

### Using curl

```bash
# Test authentication error
curl http://localhost:3001/api/categories -X POST

# Test validation error
curl http://localhost:3001/api/categories -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer valid-token" \
  -d '{}'

# Test not found error
curl http://localhost:3001/api/categories/invalid-id
```

### Using Postman

Create test cases for different error scenarios:
1. Missing authentication
2. Invalid data
3. Non-existent resources
4. Insufficient permissions

This comprehensive error handling system ensures robust and predictable API behavior for all client applications.
