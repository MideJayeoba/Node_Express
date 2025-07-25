const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// In-memory data store (array) to manage items
let items = [
  { id: 1, name: 'Sample Item 1', description: 'This is a sample item for testing' },
  { id: 2, name: 'Sample Item 2', description: 'Another sample item for testing' }
];
let nextId = 3;

// Utility function to find item by ID
const findItemById = (id) => {
  return items.find(item => item.id === parseInt(id));
};

// Validation middleware for item data
const validateItemData = (req, res, next) => {
  const { name, description } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name is required and must be a non-empty string'
    });
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Description is required and must be a non-empty string'
    });
  }
  
  next();
};

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// API route example
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// CRUD Operations for Items

// GET /items - Retrieve all items
app.get('/items', (req, res) => {
  try {
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve items'
    });
  }
});

// GET /items/:id - Retrieve a single item by ID
app.get('/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid ID parameter. ID must be a positive number'
      });
    }
    
    const item = findItemById(id);
    
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Item with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve item'
    });
  }
});

// POST /items - Create a new item
app.post('/items', validateItemData, (req, res) => {
  try {
    const { name, description } = req.body;
    
    const newItem = {
      id: nextId++,
      name: name.trim(),
      description: description.trim()
    };
    
    items.push(newItem);
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create item'
    });
  }
});

// PUT /items/:id - Update an item by ID
app.put('/items/:id', validateItemData, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Validate ID parameter
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid ID parameter. ID must be a positive number'
      });
    }
    
    const itemIndex = items.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Item with ID ${id} not found`
      });
    }
    
    // Update the item
    items[itemIndex] = {
      id: parseInt(id),
      name: name.trim(),
      description: description.trim()
    };
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      data: items[itemIndex]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update item'
    });
  }
});

// DELETE /items/:id - Delete an item by ID
app.delete('/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid ID parameter. ID must be a positive number'
      });
    }
    
    const itemIndex = items.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Item with ID ${id} not found`
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

// Error handling middleware for 404 routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET    /items      - Get all items');
  console.log('  GET    /items/:id  - Get item by ID');
  console.log('  POST   /items      - Create new item');
  console.log('  PUT    /items/:id  - Update item by ID');
  console.log('  DELETE /items/:id  - Delete item by ID');
});
