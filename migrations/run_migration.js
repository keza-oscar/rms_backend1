const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://rms_user:H8sXvafsMi55OOqcZwlnrYG1rVhcbz8x@dpg-d9fiiagk1i2s73au5la0-a.frankfurt-postgres.render.com/rms_db_6b2o',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'full_schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Schema and seed data applied successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();
