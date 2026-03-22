require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Veritabanı şeması uygulanıyor...');
  await pool.query(sql);
  console.log('Şema başarıyla uygulandı.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration hatası:', err.message);
  process.exit(1);
});
