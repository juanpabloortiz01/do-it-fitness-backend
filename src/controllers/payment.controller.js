const { PLAN_PRICES }        = require('../services/payphone.service');
const { savePendingPayment } = require('../services/supabase.service');
 
/**
 * POST /api/payment/create
 * Solo guarda los datos en Supabase.
 * PayPhone se inicializa directamente en el frontend.
 */
async function createPayment(req, res, next) {
  try {
    const nombre              = req.body.nombre      || req.body.fullName;
    const email               = req.body.email;
    const celular             = req.body.celular      || req.body.phone;
    const fechaNacimiento     = req.body.fechaNacimiento || req.body.birthDate;
    const plan                = req.body.plan;
    const clientTransactionId = req.body.clientTransactionId;
    const cedula              = req.body.cedula || req.body.documentId || '';
 
    if (!nombre || !email || !celular || !fechaNacimiento || !plan || !clientTransactionId) {
      return res.status(422).json({ error: 'Todos los campos son requeridos' });
    }
 
    const planKey = plan.toLowerCase();
    const valor   = PLAN_PRICES[planKey] / 100;
    if (!valor) return res.status(400).json({ error: `Plan inválido: ${plan}` });
 
    // Guardar en Supabase con status pending
    await savePendingPayment({
      preferenceId: clientTransactionId,
      nombre,
      email,
      celular,
      fechaNacimiento,
      plan,
      valor,
      cedula,
    });
 
    console.log(`💾 Pago pendiente guardado: ${email} — ${plan} — ${clientTransactionId}`);
 
    return res.json({ success: true, clientTransactionId });
 
  } catch (error) {
    console.error('❌ Error en createPayment:', error.message);
    next(error);
  }
}
 
module.exports = { createPayment };
