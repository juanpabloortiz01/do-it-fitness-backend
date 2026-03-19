const supabase = require('../config/supabase');

/**
 * Guarda un pago pendiente mientras esperamos el webhook de MP.
 * @param {object} data - Datos del formulario + preferenceId de MP
 */
async function savePendingPayment(data) {
  const { data: record, error } = await supabase
    .from('pending_payments')
    .insert([{
      mp_preference_id: data.preferenceId,
      nombre:           data.nombre,
      email:            data.email,
      celular:          data.celular,
      fecha_nacimiento: data.fechaNacimiento,
      plan:             data.plan,
      valor:            data.valor,
      status:           'pending',
    }])
    .select()
    .single();

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
  return record;
}

/**
 * Busca un pago pendiente por el payment_id de MercadoPago.
 * MP manda el payment_id en el webhook (distinto al preference_id).
 */
async function getPendingByPaymentId(mpPaymentId) {
  const { data, error } = await supabase
    .from('pending_payments')
    .select('*')
    .eq('mp_payment_id', mpPaymentId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Vincula el payment_id al registro (MP lo manda en el webhook).
 */
async function linkPaymentId(preferenceId, mpPaymentId) {
  const { error } = await supabase
    .from('pending_payments')
    .update({ mp_payment_id: mpPaymentId })
    .eq('mp_preference_id', preferenceId);

  if (error) throw new Error(`Supabase update error: ${error.message}`);
}

/**
 * Marca el pago como completado.
 */
async function markAsPaid(mpPaymentId) {
  const { data, error } = await supabase
    .from('pending_payments')
    .update({ status: 'paid' })
    .eq('mp_payment_id', mpPaymentId)
    .select()
    .single();

  if (error) throw new Error(`Supabase update error: ${error.message}`);
  return data;
}

module.exports = {
  savePendingPayment,
  getPendingByPaymentId,
  linkPaymentId,
  markAsPaid,
};
