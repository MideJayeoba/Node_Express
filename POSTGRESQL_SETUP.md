# 🐘 PostgreSQL User Table Setup Guide

This guide will walk you through creating a PostgreSQL database and user table for your Node.js Express application.

## 📋 Prerequisites

1. **PostgreSQL Installed**: Make sure PostgreSQL is installed on your system

   - Download from: https://www.postgresql.org/download/
   - Or use: `winget install PostgreSQL.PostgreSQL`

2. **Node.js Package Installed**: The `pg` package is already in your dependencies

## 🚀 Quick Start Guide

### Method 1: Using the Node.js Setup Script (Easiest)

1. **Update Database Configuration**

   - Copy `.env.example` to `.env`
   - Update the password and database settings in `db.js`

2. **Create the Database First** (if it doesn't exist)

   ```bash
   # Open PostgreSQL command line
   psql -U postgres

   # Create the database
   CREATE DATABASE node_express_db;

   # Exit
   \q
   ```

3. **Run the Setup Script**

   ```bash
   node setupDatabase.js
   ```

   This will:

   - Create the users table
   - Add indexes for performance
   - Set up auto-update triggers
   - Insert sample data
   - Display all users

### Method 2: Using SQL Script Directly

1. **Open PostgreSQL Command Line or pgAdmin**

   ```bash
   psql -U postgres
   ```

2. **Create the Database**

   ```sql
   CREATE DATABASE node_express_db;
   \c node_express_db;
   ```

3. **Run the SQL Script**

   ```bash
   \i setup_database.sql
   ```

   Or in Windows PowerShell:

   ```bash
   Get-Content setup_database.sql | psql -U postgres -d node_express_db
   ```

## 📊 User Table Structure

The users table includes the following columns:

| Column       | Type                | Description                         |
| ------------ | ------------------- | ----------------------------------- |
| `id`         | SERIAL PRIMARY KEY  | Auto-incrementing unique identifier |
| `username`   | VARCHAR(50) UNIQUE  | Unique username, max 50 characters  |
| `email`      | VARCHAR(100) UNIQUE | Unique email address                |
| `password`   | VARCHAR(255)        | Password (should be hashed!)        |
| `first_name` | VARCHAR(50)         | User's first name (optional)        |
| `last_name`  | VARCHAR(50)         | User's last name (optional)         |
| `age`        | INTEGER             | Age (must be 0-150)                 |
| `is_active`  | BOOLEAN             | Active status (default: true)       |
| `created_at` | TIMESTAMP           | Account creation time               |
| `updated_at` | TIMESTAMP           | Last update time (auto-updated)     |

### Features:

- ✅ Auto-incrementing IDs
- ✅ Unique constraints on username and email
- ✅ Age validation (0-150)
- ✅ Automatic timestamp tracking
- ✅ Indexes for fast lookups
- ✅ Trigger to auto-update `updated_at`

## 🔧 Configuration Steps

### Step 1: Update Database Connection

Edit `db.js` with your PostgreSQL credentials:

```javascript
const pool = new Pool({
  user: "postgres", // Your PostgreSQL username
  host: "localhost", // Usually localhost
  database: "node_express_db", // Your database name
  password: "YOUR_PASSWORD", // Your PostgreSQL password
  port: 5432, // Default port
});
```

### Step 2: Test the Connection

```bash
node -e "require('./db').query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); process.exit(); })"
```

## 📝 Using the User Model

The `user.js` file provides methods to interact with the database:

### Create a User

```javascript
const User = require("./user");

const newUser = await User.create({
  username: "testuser",
  email: "test@example.com",
  password: "hashed_password",
  first_name: "Test",
  last_name: "User",
  age: 25,
});
```

### Get All Users

```javascript
const users = await User.findAll();
```

### Get User by ID

```javascript
const user = await User.findById(1);
```

### Get User by Email

```javascript
const user = await User.findByEmail("test@example.com");
```

### Update a User

```javascript
const updated = await User.update(1, {
  username: "newusername",
  email: "newemail@example.com",
  first_name: "Updated",
  last_name: "Name",
  age: 30,
  is_active: true,
});
```

### Delete a User

```javascript
const deleted = await User.delete(1);
```

### Check if Email/Username Exists

```javascript
const emailExists = await User.emailExists("test@example.com");
const usernameExists = await User.usernameExists("testuser");
```

## 🔐 Security Best Practices

### 1. Never Store Plain Text Passwords

Install bcrypt for password hashing:

```bash
pnpm add bcrypt
```

Example usage:

```javascript
const bcrypt = require("bcrypt");

// Hash password before saving
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### 2. Use Environment Variables

Install dotenv:

```bash
pnpm add dotenv
```

Create `.env` file (add to .gitignore):

```
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_DATABASE=node_express_db
DB_PORT=5432
```

Update `db.js`:

```javascript
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
```

## 🧪 Testing Your Setup

### Test 1: Check if table exists

```sql
\dt
```

### Test 2: View table structure

```sql
\d users
```

### Test 3: Query all users

```sql
SELECT * FROM users;
```

### Test 4: Insert a test user

```sql
INSERT INTO users (username, email, password, first_name, last_name, age)
VALUES ('test', 'test@test.com', 'password123', 'Test', 'User', 25);
```

## 🛠️ Troubleshooting

### Problem: Can't connect to PostgreSQL

**Solution**:

- Check if PostgreSQL service is running
- Verify username and password
- Check port (default is 5432)

### Problem: Database doesn't exist

**Solution**:

```sql
CREATE DATABASE node_express_db;
```

### Problem: Permission denied

**Solution**: Make sure your PostgreSQL user has proper permissions

```sql
GRANT ALL PRIVILEGES ON DATABASE node_express_db TO your_user;
```

### Problem: Table already exists

**Solution**: Drop and recreate

```sql
DROP TABLE IF EXISTS users CASCADE;
```

## 📚 Useful PostgreSQL Commands

```sql
-- List all databases
\l

-- Connect to a database
\c database_name

-- List all tables
\dt

-- Describe table structure
\d table_name

-- Show all users in the users table
SELECT * FROM users;

-- Delete all data from table
TRUNCATE TABLE users;

-- Drop the table
DROP TABLE users;

-- Exit psql
\q
```

## 🎯 Next Steps

1. ✅ Install PostgreSQL
2. ✅ Create the database
3. ✅ Run the setup script
4. ✅ Update your Express routes to use the User model
5. ✅ Add password hashing
6. ✅ Add input validation
7. ✅ Add authentication (JWT tokens)

## 📖 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres Documentation](https://node-postgres.com/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
