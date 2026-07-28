const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://rms_user:H8sXvafsMi55OOqcZwlnrYG1rVhcbz8x@dpg-d9fiiagk1i2s73au5la0-a.frankfurt-postgres.render.com/rms_db_6b2o',
  ssl: { rejectUnauthorized: false }
});

async function updateImages() {
  try {
    await pool.query(`UPDATE menu_item SET image_url = '/images/menu/mandazi.png' WHERE item_name = 'Mandazi'`);
    await pool.query(`UPDATE menu_item SET image_url = '/images/menu/chipsi-mayai.png' WHERE item_name = 'Chips Mayai'`);
    await pool.query(`UPDATE menu_item SET image_url = '/images/menu/passion-juice.png' WHERE item_name = 'Passion Juice'`);
    await pool.query(`UPDATE menu_item SET image_url = '/images/menu/nyama-choma.png' WHERE item_name = 'Nyama Choma'`);
    await pool.query(`UPDATE menu_item SET image_url = '/images/menu/pilau-rice.png' WHERE item_name = 'Pilau Rice'`);
    console.log('All 5 menu images updated!');
    
    const result = await pool.query('SELECT item_name, image_url FROM menu_item ORDER BY item_id');
    result.rows.forEach(r => console.log(`  ${r.item_name}: ${r.image_url || '(no image)'}`));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateImages();
