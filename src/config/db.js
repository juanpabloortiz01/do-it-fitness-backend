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

// Migración rápida para asegurar que las columnas necesarias existan en pending_payments
pool.query(`
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS cedula TEXT;
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS promo_code TEXT;
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS objetivo TEXT;
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS nivel_experiencia TEXT;
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS horario TEXT;
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS tipo_actividad TEXT;
  ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS ocupacion TEXT;
`).then(() => {
  console.log('✅ Base de datos verificada/migrada con éxito (columnas de encuesta y cédula añadidas)');
}).catch(err => {
  console.error('❌ Error de migración en pending_payments:', err.message);
});

module.exports = pool;

