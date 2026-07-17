const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      false,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
});

// Migración rápida para asegurar que la columna promo_code exista en pending_payments
pool.query(`
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS promo_code TEXT;
`).then(() => {
  console.log('✅ Base de datos verificada/migrada con éxito (columna promo_code)');
}).catch(err => {
  console.error('❌ Error de migración en pending_payments:', err.message);
});

module.exports = pool;

