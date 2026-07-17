const pool = require('../config/db');

/**
 * Guarda un pago pendiente en PostgreSQL.
 */
async function savePendingPayment(data) {
  const query = `
    INSERT INTO pending_payments 
      (mp_preference_id, nombre, email, celular, fecha_nacimiento, plan, valor, cedula, status, promo_code, objetivo, nivel_experiencia, horario, tipo_actividad, ocupacion)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;
  const values = [
    data.preferenceId,
    data.nombre,
    data.email,
    data.celular,
    data.fechaNacimiento,
    data.plan,
    data.valor,
    data.cedula || '',
    data.promoCode || null,
    data.objetivo || null,
    data.nivel_experiencia || null,
    data.horario || null,
    data.tipo_actividad || null,
    data.ocupacion || null,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Busca un pago pendiente por clientTransactionId.
 */
async function getPendingByPreferenceId(preferenceId) {
  const result = await pool.query(
    `SELECT * FROM pending_payments WHERE mp_preference_id = $1 AND status = 'pending' LIMIT 1`,
    [preferenceId]
  );
  return result.rows[0] || null;
}

/**
 * Actualiza el payment_id de un registro.
 */
async function updatePaymentId(preferenceId, paymentId) {
  await pool.query(
    `UPDATE pending_payments SET mp_payment_id = $1 WHERE mp_preference_id = $2`,
    [paymentId, preferenceId]
  );
}

/**
 * Marca un pago como completado.
 */
async function markAsPaid(preferenceId) {
  await pool.query(
    `UPDATE pending_payments SET status = 'paid', updated_at = NOW() WHERE mp_preference_id = $1`,
    [preferenceId]
  );
}

/**
 * Verifica si ya fue procesado (idempotencia).
 */
async function isAlreadyPaid(preferenceId) {
  const result = await pool.query(
    `SELECT id FROM pending_payments WHERE mp_preference_id = $1 AND status = 'paid' LIMIT 1`,
    [preferenceId]
  );
  return result.rows.length > 0;
}

/**
 * Busca un código de promoción en la tabla leads_promo.
 */
async function getPromoByCode(code) {
  const result = await pool.query(
    `SELECT * FROM leads_promo WHERE promo_code = $1 LIMIT 1`,
    [code]
  );
  return result.rows[0] || null;
}

/**
 * Marca un código de promoción como utilizado.
 */
async function markPromoAsUsed(code) {
  await pool.query(
    `UPDATE leads_promo SET used = true, used_at = NOW() WHERE promo_code = $1`,
    [code]
  );
}

module.exports = {
  savePendingPayment,
  getPendingByPreferenceId,
  updatePaymentId,
  markAsPaid,
  isAlreadyPaid,
  getPromoByCode,
  markPromoAsUsed,
};
