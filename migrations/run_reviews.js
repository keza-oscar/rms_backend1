const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://rms_user:H8sXvafsMi55OOqcZwlnrYG1rVhcbz8x@dpg-d9fiiagk1i2s73au5la0-a.frankfurt-postgres.render.com/rms_db_6b2o',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        rating INTEGER DEFAULT 5,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Reviews table created!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();
