require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, param, query, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 900
  }
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  }
});

app.use('/api/', limiter);
app.use('/auth/', authLimiter);

// Middleware to parse JSON requests with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory data stores (in production, use a proper database)
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
    role: 'admin',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    isActive: true
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
    role: 'user',
    createdAt: new Date('2024-01-02T00:00:00Z'),
    isActive: true
  }
];
let nextUserId = 3;

// Enhanced items data store with categories and user association
let categories = [
  { id: 1, name: 'Electronics', description: 'Electronic devices and gadgets' },
  { id: 2, name: 'Books', description: 'Books and publications' },
  { id: 3, name: 'Clothing', description: 'Apparel and fashion items' }
];
let nextCategoryId = 4;

let items = [
  { 
    id: 1, 
    name: 'Smartphone', 
    description: 'Latest model smartphone with advanced features',
    price: 999.99,
    categoryId: 1,
    userId: 1,
    tags: ['electronics', 'mobile', 'technology'],
    stock: 50,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    isActive: true
  },
  { 
    id: 2, 
    name: 'Programming Book', 
    description: 'Complete guide to Node.js development',
    price: 49.99,
    categoryId: 2,
    userId: 2,
    tags: ['books', 'programming', 'nodejs'],
    stock: 25,
    createdAt: new Date('2024-01-02T11:00:00Z'),
    updatedAt: new Date('2024-01-02T11:00:00Z'),
    isActive: true
  }
];
let nextId = 3;

// Utility functions
const findItemById = (id) => {
  return items.find(item => item.id === parseInt(id));
};

const findUserById = (id) => {
  return users.find(user => user.id === parseInt(id));
};

const findUserByUsername = (username) => {
  return users.find(user => user.username === username);
};

const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

const findCategoryById = (id) => {
  return categories.find(category => category.id === parseInt(id));
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or expired token'
      });
    }
    
    const user = findUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User not found or inactive'
      });
    }
    
    req.user = user;
    next();
  });
};

// Middleware for admin authentication
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

// Enhanced validation middleware
const validateItemData = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  handleValidationErrors
];

const validateUserRegistration = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

const validateUserLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateCategoryData = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be at most 200 characters')
    .trim(),
  handleValidationErrors
];

// Validation for URL parameters
const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// Pagination and filtering helpers
const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getFilterParams = (req) => {
  const filters = {};
  
  if (req.query.category) filters.categoryId = parseInt(req.query.category);
  if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice);
  if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice);
  if (req.query.search) filters.search = req.query.search.toLowerCase();
  if (req.query.tags) filters.tags = req.query.tags.split(',').map(tag => tag.trim());
  if (req.query.userId) filters.userId = parseInt(req.query.userId);
  if (req.query.active !== undefined) filters.active = req.query.active === 'true';
  
  return filters;
};

const getSortParams = (req) => {
  const allowedSorts = ['id', 'name', 'price', 'createdAt', 'updatedAt'];
  const sortBy = allowedSorts.includes(req.query.sortBy) ? req.query.sortBy : 'id';
  const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
  return { sortBy, sortOrder };
};

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Complex Express.js API',
    version: '1.0.0',
    documentation: {
      authentication: 'POST /auth/register, POST /auth/login',
      items: 'GET /api/items, POST /api/items, PUT /api/items/:id, DELETE /api/items/:id',
      categories: 'GET /api/categories, POST /api/categories',
      users: 'GET /api/users (admin only)',
      health: 'GET /api/health'
    },
    features: [
      'JWT Authentication',
      'Role-based Authorization',
      'Rate Limiting',
      'Input Validation',
      'Pagination & Filtering',
      'Search Functionality',
      'Security Headers',
      'Request Logging'
    ]
  });
});

// Health check endpoint with detailed system information
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Complex API Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Authentication Routes
app.post('/auth/register', validateUserRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    if (findUserByUsername(username)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username already exists'
      });
    }
    
    if (findUserByEmail(email)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: nextUserId++,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      isActive: true
    };
    
    users.push(newUser);
    
    // Generate token
    const token = generateToken(newUser.id);
    
    // Return user data without password
    const { password: _, ...userResponse } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
});

app.post('/auth/login', validateUserLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = findUserByUsername(username);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials or inactive account'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Return user data without password
    const { password: _, ...userResponse } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

// Get current user profile
app.get('/auth/me', authenticateToken, (req, res) => {
  const { password, ...userResponse } = req.user;
  res.json({
    success: true,
    data: userResponse
  });
});

// Enhanced CRUD Operations for Items

// GET /api/items - Retrieve items with advanced filtering, pagination, and search
app.get('/api/items', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isInt({ min: 1 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional().isLength({ max: 100 }),
  query('sortBy').optional().isIn(['id', 'name', 'price', 'createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidationErrors
], (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const filters = getFilterParams(req);
    const { sortBy, sortOrder } = getSortParams(req);
    
    // Apply filters
    let filteredItems = items.filter(item => {
      if (!item.isActive && filters.active !== false) return false;
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
      if (filters.userId && item.userId !== filters.userId) return false;
      if (filters.minPrice && item.price < filters.minPrice) return false;
      if (filters.maxPrice && item.price > filters.maxPrice) return false;
      if (filters.active !== undefined && item.isActive !== filters.active) return false;
      
      // Search in name, description, and tags
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(searchLower);
        const matchesDescription = item.description.toLowerCase().includes(searchLower);
        const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesName && !matchesDescription && !matchesTags) return false;
      }
      
      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag => 
          item.tags.some(itemTag => itemTag.toLowerCase() === filterTag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
    
    // Apply sorting
    filteredItems.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
    
    // Apply pagination
    const totalItems = filteredItems.length;
    const paginatedItems = filteredItems.slice(skip, skip + limit);
    
    // Enrich with category and user information
    const enrichedItems = paginatedItems.map(item => {
      const category = findCategoryById(item.categoryId);
      const user = findUserById(item.userId);
      return {
        ...item,
        category: category ? { id: category.id, name: category.name } : null,
        user: user ? { id: user.id, username: user.username } : null
      };
    });
    
    res.json({
      success: true,
      data: enrichedItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit,
        hasNextPage: (skip + limit) < totalItems,
        hasPreviousPage: page > 1
      },
      filters: filters,
      sort: { sortBy, sortOrder }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve items'
    });
  }
});

// GET /api/items/:id - Retrieve a single item by ID with enriched data
app.get('/api/items/:id', validateIdParam, (req, res) => {
  try {
    const { id } = req.params;
    const item = findItemById(id);
    
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Item with ID ${id} not found`
      });
    }
    
    // Enrich with category and user information
    const category = findCategoryById(item.categoryId);
    const user = findUserById(item.userId);
    
    const enrichedItem = {
      ...item,
      category: category ? { id: category.id, name: category.name, description: category.description } : null,
      user: user ? { id: user.id, username: user.username, email: user.email } : null
    };
    
    res.json({
      success: true,
      data: enrichedItem
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve item'
    });
  }
});

// POST /api/items - Create a new item (requires authentication)
app.post('/api/items', authenticateToken, validateItemData, (req, res) => {
  try {
    const { name, description, price, categoryId, tags, stock } = req.body;
    
    // Validate category exists if provided
    if (categoryId && !findCategoryById(categoryId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid category ID'
      });
    }
    
    const newItem = {
      id: nextId++,
      name: name.trim(),
      description: description.trim(),
      price: price || 0,
      categoryId: categoryId || null,
      userId: req.user.id,
      tags: tags || [],
      stock: stock || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    items.push(newItem);
    
    // Return enriched item
    const category = findCategoryById(newItem.categoryId);
    const enrichedItem = {
      ...newItem,
      category: category ? { id: category.id, name: category.name } : null,
      user: { id: req.user.id, username: req.user.username }
    };
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: enrichedItem
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create item'
    });
  }
});

// POST /api/items/bulk - Create multiple items at once (requires authentication)
app.post('/api/items/bulk', authenticateToken, [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Items must be an array with 1-50 items'),
  body('items.*.name').notEmpty().isLength({ min: 1, max: 100 }),
  body('items.*.description').notEmpty().isLength({ min: 1, max: 500 }),
  body('items.*.price').optional().isFloat({ min: 0 }),
  body('items.*.categoryId').optional().isInt({ min: 1 }),
  body('items.*.tags').optional().isArray(),
  body('items.*.stock').optional().isInt({ min: 0 }),
  handleValidationErrors
], (req, res) => {
  try {
    const { items: itemsToCreate } = req.body;
    const createdItems = [];
    const errors = [];
    
    for (let i = 0; i < itemsToCreate.length; i++) {
      const itemData = itemsToCreate[i];
      
      // Validate category exists if provided
      if (itemData.categoryId && !findCategoryById(itemData.categoryId)) {
        errors.push(`Item ${i + 1}: Invalid category ID`);
        continue;
      }
      
      const newItem = {
        id: nextId++,
        name: itemData.name.trim(),
        description: itemData.description.trim(),
        price: itemData.price || 0,
        categoryId: itemData.categoryId || null,
        userId: req.user.id,
        tags: itemData.tags || [],
        stock: itemData.stock || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      items.push(newItem);
      createdItems.push(newItem);
    }
    
    res.status(201).json({
      success: true,
      message: `${createdItems.length} items created successfully`,
      data: {
        created: createdItems,
        errors: errors
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create items'
    });
  }
});

// PUT /api/items/:id - Update an item by ID (requires authentication and ownership or admin)
app.put('/api/items/:id', authenticateToken, validateIdParam, validateItemData, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, tags, stock, isActive } = req.body;
    
    const itemIndex = items.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Item with ID ${id} not found`
      });
    }
    
    const existingItem = items[itemIndex];
    
    // Check ownership or admin rights
    if (existingItem.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own items'
      });
    }
    
    // Validate category exists if provided
    if (categoryId && !findCategoryById(categoryId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid category ID'
      });
    }
    
    // Update the item
    items[itemIndex] = {
      ...existingItem,
      name: name.trim(),
      description: description.trim(),
      price: price !== undefined ? price : existingItem.price,
      categoryId: categoryId !== undefined ? categoryId : existingItem.categoryId,
      tags: tags !== undefined ? tags : existingItem.tags,
      stock: stock !== undefined ? stock : existingItem.stock,
      isActive: req.user.role === 'admin' && isActive !== undefined ? isActive : existingItem.isActive,
      updatedAt: new Date()
    };
    
    // Return enriched item
    const category = findCategoryById(items[itemIndex].categoryId);
    const user = findUserById(items[itemIndex].userId);
    const enrichedItem = {
      ...items[itemIndex],
      category: category ? { id: category.id, name: category.name } : null,
      user: user ? { id: user.id, username: user.username } : null
    };
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      data: enrichedItem
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update item'
    });
  }
});

// DELETE /api/items/:id - Delete an item by ID (requires authentication and ownership or admin)
app.delete('/api/items/:id', authenticateToken, validateIdParam, (req, res) => {
  try {
    const { id } = req.params;
    
    const itemIndex = items.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Item with ID ${id} not found`
      });
    }
    
    const existingItem = items[itemIndex];
    
    // Check ownership or admin rights
    if (existingItem.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own items'
      });
    }
    
    const deletedItem = items.splice(itemIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete item'
    });
  }
});

// DELETE /api/items/bulk - Delete multiple items (requires authentication)
app.delete('/api/items/bulk', authenticateToken, [
  body('itemIds').isArray({ min: 1, max: 50 }).withMessage('itemIds must be an array with 1-50 items'),
  body('itemIds.*').isInt({ min: 1 }).withMessage('Each item ID must be a positive integer'),
  handleValidationErrors
], (req, res) => {
  try {
    const { itemIds } = req.body;
    const deletedItems = [];
    const errors = [];
    
    for (const itemId of itemIds) {
      const itemIndex = items.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        errors.push(`Item with ID ${itemId} not found`);
        continue;
      }
      
      const existingItem = items[itemIndex];
      
      // Check ownership or admin rights
      if (existingItem.userId !== req.user.id && req.user.role !== 'admin') {
        errors.push(`No permission to delete item with ID ${itemId}`);
        continue;
      }
      
      const deletedItem = items.splice(itemIndex, 1)[0];
      deletedItems.push(deletedItem);
    }
    
    res.json({
      success: true,
      message: `${deletedItems.length} items deleted successfully`,
      data: {
        deleted: deletedItems,
        errors: errors
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete items'
    });
  }
});

// Category Management Routes

// GET /api/categories - Get all categories
app.get('/api/categories', (req, res) => {
  try {
    const categoriesWithCounts = categories.map(category => {
      const itemCount = items.filter(item => item.categoryId === category.id && item.isActive).length;
      return {
        ...category,
        itemCount
      };
    });
    
    res.json({
      success: true,
      count: categoriesWithCounts.length,
      data: categoriesWithCounts
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve categories'
    });
  }
});

// GET /api/categories/:id - Get category by ID with items
app.get('/api/categories/:id', validateIdParam, (req, res) => {
  try {
    const { id } = req.params;
    const category = findCategoryById(id);
    
    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Category with ID ${id} not found`
      });
    }
    
    const categoryItems = items.filter(item => item.categoryId === parseInt(id) && item.isActive);
    
    res.json({
      success: true,
      data: {
        ...category,
        items: categoryItems
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve category'
    });
  }
});

// POST /api/categories - Create new category (requires admin)
app.post('/api/categories', authenticateToken, requireAdmin, validateCategoryData, (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if category name already exists
    const existingCategory = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category name already exists'
      });
    }
    
    const newCategory = {
      id: nextCategoryId++,
      name: name.trim(),
      description: description ? description.trim() : '',
      createdAt: new Date()
    };
    
    categories.push(newCategory);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category'
    });
  }
});

// User Management Routes (Admin only)

// GET /api/users - Get all users (admin only)
app.get('/api/users', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['admin', 'user']),
  query('active').optional().isBoolean(),
  handleValidationErrors
], (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { role, active } = req.query;
    
    // Apply filters
    let filteredUsers = users.filter(user => {
      if (role && user.role !== role) return false;
      if (active !== undefined && user.isActive !== (active === 'true')) return false;
      return true;
    });
    
    // Apply pagination
    const totalUsers = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);
    
    // Remove passwords from response
    const usersResponse = paginatedUsers.map(({ password, ...user }) => user);
    
    res.json({
      success: true,
      data: usersResponse,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        usersPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve users'
    });
  }
});

// GET /api/users/:id - Get user by ID (admin only)
app.get('/api/users/:id', authenticateToken, requireAdmin, validateIdParam, (req, res) => {
  try {
    const { id } = req.params;
    const user = findUserById(id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: `User with ID ${id} not found`
      });
    }
    
    // Get user's items
    const userItems = items.filter(item => item.userId === parseInt(id));
    
    // Remove password from response
    const { password, ...userResponse } = user;
    
    res.json({
      success: true,
      data: {
        ...userResponse,
        itemsCreated: userItems.length,
        recentItems: userItems.slice(-5) // Last 5 items
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user'
    });
  }
});

// PUT /api/users/:id/status - Update user status (admin only)
app.put('/api/users/:id/status', authenticateToken, requireAdmin, validateIdParam, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors
], (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const userIndex = users.findIndex(user => user.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `User with ID ${id} not found`
      });
    }
    
    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.user.id && !isActive) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot deactivate your own account'
      });
    }
    
    users[userIndex].isActive = isActive;
    
    const { password, ...userResponse } = users[userIndex];
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user status'
    });
  }
});

// Statistics endpoint (admin only)
app.get('/api/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const totalItems = items.length;
    const activeItems = items.filter(item => item.isActive).length;
    const totalCategories = categories.length;
    
    const itemsByCategory = categories.map(category => ({
      category: category.name,
      count: items.filter(item => item.categoryId === category.id && item.isActive).length
    }));
    
    const itemsByUser = users.map(user => ({
      username: user.username,
      count: items.filter(item => item.userId === user.id && item.isActive).length
    })).filter(stat => stat.count > 0);
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        items: {
          total: totalItems,
          active: activeItems,
          inactive: totalItems - activeItems
        },
        categories: {
          total: totalCategories
        },
        breakdown: {
          itemsByCategory,
          itemsByUser
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics'
    });
  }
});
// Error handling middleware for 404 routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestion: 'Check the API documentation at GET / for available endpoints'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token expired'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Complex Express.js API Server is running on http://localhost:${port}`);
  console.log('\n📚 Available endpoints:');
  console.log('🏠 Basic:');
  console.log('  GET    /              - API documentation');
  console.log('  GET    /api/health    - Health check');
  console.log('\n🔐 Authentication:');
  console.log('  POST   /auth/register - Register new user');
  console.log('  POST   /auth/login    - User login');
  console.log('  GET    /auth/me       - Get current user profile');
  console.log('\n📦 Items (Authentication required):');
  console.log('  GET    /api/items     - Get items with filtering & pagination');
  console.log('  GET    /api/items/:id - Get item by ID');
  console.log('  POST   /api/items     - Create new item');
  console.log('  POST   /api/items/bulk - Create multiple items');
  console.log('  PUT    /api/items/:id - Update item (owner or admin)');
  console.log('  DELETE /api/items/:id - Delete item (owner or admin)');
  console.log('  DELETE /api/items/bulk - Delete multiple items');
  console.log('\n🏷️ Categories:');
  console.log('  GET    /api/categories     - Get all categories');
  console.log('  GET    /api/categories/:id - Get category by ID');
  console.log('  POST   /api/categories     - Create category (admin only)');
  console.log('\n👥 Users (Admin only):');
  console.log('  GET    /api/users         - Get all users');
  console.log('  GET    /api/users/:id     - Get user by ID');
  console.log('  PUT    /api/users/:id/status - Update user status');
  console.log('\n📊 Statistics (Admin only):');
  console.log('  GET    /api/stats        - Get system statistics');
  console.log('\n🔧 Features enabled:');
  console.log('  ✅ JWT Authentication & Authorization');
  console.log('  ✅ Role-based Access Control');
  console.log('  ✅ Rate Limiting');
  console.log('  ✅ Input Validation & Sanitization');
  console.log('  ✅ Pagination & Filtering');
  console.log('  ✅ Search Functionality');
  console.log('  ✅ Bulk Operations');
  console.log('  ✅ Security Headers');
  console.log('  ✅ Request Logging');
  console.log('  ✅ CORS Support');
  console.log('  ✅ Comprehensive Error Handling');
});
