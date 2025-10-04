const pool = require('./db');

async function setupDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100)
      )
    `);
    
    console.log('✅ Users table created successfully!');
    
    const result = await pool.query('SELECT * FROM users');
    console.log('Users:', result.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();
