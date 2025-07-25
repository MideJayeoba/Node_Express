# Express CRUD API

A simple Express.js REST API for managing items with full CRUD operations.

## Features

- ✅ **Create** new items
- ✅ **Read** all items or single item by ID
- ✅ **Update** existing items
- ✅ **Delete** items by ID
- ✅ In-memory data storage
- ✅ Input validation
- ✅ Error handling with appropriate status codes
- ✅ Auto-restart in development mode

## Getting Started

### Prerequisites

- Node.js installed on your machine
- npm (Node Package Manager)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
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

## API Endpoints

### Base URL

```
http://localhost:3000
```

### Endpoints

| Method | Endpoint     | Description       | Request Body                                    |
| ------ | ------------ | ----------------- | ----------------------------------------------- |
| GET    | `/items`     | Get all items     | None                                            |
| GET    | `/items/:id` | Get item by ID    | None                                            |
| POST   | `/items`     | Create new item   | `{ "name": "string", "description": "string" }` |
| PUT    | `/items/:id` | Update item by ID | `{ "name": "string", "description": "string" }` |
| DELETE | `/items/:id` | Delete item by ID | None                                            |

### Additional Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

## Request/Response Examples

### Get All Items

```bash
GET /items
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Sample Item 1",
      "description": "This is a sample item for testing"
    },
    {
      "id": 2,
      "name": "Sample Item 2",
      "description": "Another sample item for testing"
    }
  ]
}
```

### Get Single Item

```bash
GET /items/1
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sample Item 1",
    "description": "This is a sample item for testing"
  }
}
```

### Create New Item

```bash
POST /items
Content-Type: application/json

{
  "name": "New Item",
  "description": "This is a new item"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": 3,
    "name": "New Item",
    "description": "This is a new item"
  }
}
```

### Update Item

```bash
PUT /items/1
Content-Type: application/json

{
  "name": "Updated Item",
  "description": "This item has been updated"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Item",
    "description": "This item has been updated"
  }
}
```

### Delete Item

```bash
DELETE /items/1
```

**Response:**

```json
{
  "success": true,
  "message": "Item deleted successfully",
  "data": {
    "id": 1,
    "name": "Updated Item",
    "description": "This item has been updated"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Name is required and must be a non-empty string"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Item with ID 999 not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve items"
}
```

## Testing the API

You can test the API using:

### Using curl

```bash
# Get all items
curl http://localhost:3000/items

# Get single item
curl http://localhost:3000/items/1

# Create new item
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Testing the API"}'

# Update item
curl -X PUT http://localhost:3000/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Item","description":"Updated description"}'

# Delete item
curl -X DELETE http://localhost:3000/items/1
```

### Using a REST Client

- **Postman**
- **Insomnia**
- **VS Code REST Client extension**

## Data Validation

Each item must have:

- **name**: Required, non-empty string
- **description**: Required, non-empty string

## Technical Details

- **Framework**: Express.js
- **Data Storage**: In-memory array (resets on server restart)
- **Validation**: Custom middleware for request data validation
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **Development**: Auto-restart with nodemon

## Project Structure

```
Node_Express/
├── index.js          # Main server file
├── package.json      # Project dependencies and scripts
├── .gitignore        # Git ignore rules
└── README.md         # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC License
