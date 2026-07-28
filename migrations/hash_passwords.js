const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://rms_user:H8sXvafsMi55OOqcZwlnrYG1rVhcbz8x@dpg-d9fiiagk1i2s73au5la0-a.frankfurt-postgres.render.com/rms_db_6b2o',
  ssl: { rejectUnauthorized: false }
});

const newPasswords = {
  'admin': 'Admin@2025',
  'manager': 'Manager@2025',
  'cashier': 'Cashier@2025',
  'waiter': 'Waiter@2025',
  'chef': 'Chef@2025',
  'auditor': 'Auditor@2025'
};

async function hashPasswords() {
  try {
    for (const [username, plainPassword] of Object.entries(newPasswords)) {
      const hash = await bcrypt.hash(plainPassword, 10);
      await pool.query('UPDATE useraccount SET password = $1 WHERE username = $2', [hash, username]);
      console.log(`Updated: ${username} -> ${plainPassword}`);
    }
    console.log('\nAll passwords hashed and updated!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

hashPasswords();
