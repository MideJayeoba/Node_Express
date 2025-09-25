# Complex Express.js API

A comprehensive and sophisticated Express.js REST API featuring advanced authentication, authorization, pagination, filtering, rate limiting, and more enterprise-level features.

## 🚀 Features

- ✅ **JWT Authentication & Authorization** - Secure token-based authentication
- ✅ **Role-based Access Control** - Admin and user roles with different permissions  
- ✅ **Rate Limiting** - Prevents abuse with configurable limits
- ✅ **Advanced Input Validation** - Comprehensive request validation using express-validator
- ✅ **Pagination & Filtering** - Efficient data retrieval with search capabilities
- ✅ **Bulk Operations** - Create and delete multiple items at once
- ✅ **Search Functionality** - Full-text search across multiple fields
- ✅ **Security Headers** - Helmet.js for enhanced security
- ✅ **Request Logging** - Morgan logging for monitoring and debugging
- ✅ **CORS Support** - Cross-origin resource sharing enabled
- ✅ **Data Relationships** - Items linked to categories and users
- ✅ **Comprehensive Error Handling** - Detailed error responses with proper HTTP codes
- ✅ **Statistics Dashboard** - Admin analytics and insights
- ✅ **User Management** - Admin user control and monitoring

## 🏗️ Architecture

### Technology Stack
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, Rate Limiting
- **Logging**: Morgan
- **Password Hashing**: bcryptjs
- **Data Storage**: In-memory (easily adaptable to databases)

### Project Structure
```
Node_Express/
├── index.js          # Main server file with all endpoints
├── package.json      # Project dependencies and scripts
├── .env              # Environment variables (excluded from git)
├── .gitignore        # Git ignore rules
└── README.md         # Comprehensive documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   
4. Configure environment variables in `.env`:
   ```
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   NODE_ENV=development
   ```

### Running the Application

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### Default Users
- **Admin**: username: `admin`, password: `password`
- **User**: username: `user1`, password: `password`

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Get your token by logging in via `POST /auth/login`

## 🔐 Authentication Endpoints

### Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com", 
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 3,
      "username": "newuser",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2024-01-03T12:00:00Z",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### User Login  
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User Profile
```http
GET /auth/me
Authorization: Bearer <token>
```

## 📦 Items Endpoints (Authentication Required)

### Get All Items with Advanced Filtering
```http  
GET /api/items?page=1&limit=10&search=laptop&category=1&minPrice=100&maxPrice=2000&sortBy=price&sortOrder=desc&tags=electronics,gaming
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (1-100, default: 10) 
- `search` (string): Search in name, description, and tags
- `category` (int): Filter by category ID
- `minPrice` (float): Minimum price filter
- `maxPrice` (float): Maximum price filter
- `tags` (string): Comma-separated tags to filter by
- `userId` (int): Filter by user ID
- `active` (boolean): Filter by active status
- `sortBy` (string): Sort field (id, name, price, createdAt, updatedAt)
- `sortOrder` (string): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Gaming Laptop",
      "description": "High-performance gaming laptop",
      "price": 1299.99,
      "categoryId": 1,
      "userId": 1,
      "tags": ["electronics", "gaming", "laptop"],
      "stock": 10,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "isActive": true,
      "category": {
        "id": 1,
        "name": "Electronics"
      },
      "user": {
        "id": 1,
        "username": "admin"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": {
    "search": "laptop",
    "categoryId": 1
  },
  "sort": {
    "sortBy": "price", 
    "sortOrder": "desc"
  }
}
```

### Get Single Item
```http
GET /api/items/:id
```

### Create New Item
```http
POST /api/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop with RGB lighting",
  "price": 1299.99,
  "categoryId": 1,
  "tags": ["electronics", "gaming", "laptop"],
  "stock": 10
}
```

### Create Multiple Items (Bulk)
```http
POST /api/items/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "name": "Item 1",
      "description": "Description 1",
      "price": 99.99,
      "categoryId": 1
    },
    {
      "name": "Item 2", 
      "description": "Description 2",
      "price": 199.99,
      "categoryId": 2
    }
  ]
}
```

### Update Item (Owner or Admin only)
```http
PUT /api/items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Gaming Laptop",
  "description": "Updated description",
  "price": 1199.99,
  "stock": 15
}
```

### Delete Item (Owner or Admin only)
```http
DELETE /api/items/:id
Authorization: Bearer <token>
```

### Delete Multiple Items (Bulk)
```http
DELETE /api/items/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemIds": [1, 2, 3]
}
```

## 🏷️ Categories Endpoints

### Get All Categories
```http
GET /api/categories
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "itemCount": 25
    }
  ]
}
```

### Get Category by ID
```http
GET /api/categories/:id
```

### Create Category (Admin only)
```http
POST /api/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Sports",
  "description": "Sports equipment and gear"
}
```

## 👥 User Management (Admin Only)

### Get All Users
```http
GET /api/users?page=1&limit=10&role=user&active=true
Authorization: Bearer <admin-token>
```

### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <admin-token>
```

### Update User Status  
```http
PUT /api/users/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "isActive": false
}
```

## 📊 Statistics (Admin Only)

### Get System Statistics
```http
GET /api/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 10,
      "active": 8,
      "inactive": 2
    },
    "items": {
      "total": 150,
      "active": 145,
      "inactive": 5
    },
    "categories": {
      "total": 8
    },
    "breakdown": {
      "itemsByCategory": [
        {
          "category": "Electronics",
          "count": 45
        }
      ],
      "itemsByUser": [
        {
          "username": "admin",
          "count": 30
        }
      ]
    }
  }
}
```

## 🔧 System Endpoints

### API Documentation
```http
GET /
```

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Complex API Server is running", 
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 62787584,
    "heapTotal": 11689984,
    "heapUsed": 10764928,
    "external": 1916264,
    "arrayBuffers": 16619
  },
  "environment": "development",
  "version": "1.0.0"
}
```

## ⚠️ Error Responses

### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Access token is required"
}
```

### Rate Limit Errors
```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

### Not Found Errors
```json
{
  "error": "Not Found",
  "message": "Item with ID 999 not found"
}
```

## 🧪 Testing the API

### Authentication Flow
```bash
# 1. Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123"}'

# 2. Login and get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# 3. Use token for protected endpoints
TOKEN="your-jwt-token-here"
curl -X GET http://localhost:3000/api/items \
  -H "Authorization: Bearer $TOKEN"
```

### Advanced Filtering Examples
```bash
# Search for items containing "laptop" in Electronics category
curl "http://localhost:3000/api/items?search=laptop&category=1"

# Get items sorted by price (highest first) with pagination
curl "http://localhost:3000/api/items?sortBy=price&sortOrder=desc&page=1&limit=5"

# Filter by price range and tags
curl "http://localhost:3000/api/items?minPrice=100&maxPrice=1000&tags=electronics,gaming"
```

### Bulk Operations
```bash
# Create multiple items
curl -X POST http://localhost:3000/api/items/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"name":"Item 1","description":"First item","price":99.99},
      {"name":"Item 2","description":"Second item","price":199.99}
    ]
  }'

# Delete multiple items
curl -X DELETE http://localhost:3000/api/items/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemIds":[1,2,3]}'
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes for API endpoints, 5 requests per 15 minutes for auth endpoints
- **JWT Authentication**: Secure token-based authentication with configurable expiration
- **Password Hashing**: bcryptjs with salt rounds for secure password storage
- **Input Validation**: Comprehensive validation using express-validator
- **Security Headers**: Helmet.js provides various security headers
- **CORS**: Configurable cross-origin resource sharing
- **Error Handling**: Detailed but secure error responses

## 🔧 Configuration

### Environment Variables
```env
PORT=3000                                    # Server port
JWT_SECRET=your-super-secret-jwt-key         # JWT signing secret
JWT_EXPIRES_IN=24h                          # Token expiration time
NODE_ENV=development                         # Environment (development/production)
```

### Rate Limiting
- API endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Customize in the middleware configuration

### Pagination Defaults
- Default page size: 10 items
- Maximum page size: 100 items
- Minimum page size: 1 item

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance Considerations

- In-memory data storage (easily replaceable with database)
- Efficient pagination with skip/limit
- Optimized search with indexed fields
- Rate limiting to prevent abuse
- Comprehensive caching headers

## 🔄 Migration to Database

The API is designed to easily migrate from in-memory storage to a database:

1. Replace the in-memory arrays with database models
2. Update the utility functions to use database queries
3. Add proper database connection and configuration
4. Implement proper transactions for data integrity

Example database integration points:
- `findItemById()` → Database query
- `items.push()` → Database insert
- `items.splice()` → Database delete

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [Express Validator](https://express-validator.github.io/)
- [Helmet.js](https://helmetjs.github.io/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👨‍💻 Author

Built with ❤️ using Express.js and modern JavaScript practices.
