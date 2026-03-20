const { createTransaction, PLAN_PRICES } = require('../services/payphone.service');
const { savePendingPayment }             = require('../services/supabase.service');
const { v4: uuidv4 }                     = require('uuid');

/**
 * POST /api/payment/create
 * Acepta campos del frontend (fullName, phone, birthDate)
 * y del backend (nombre, celular, fechaNacimiento)
 */
async function createPayment(req, res, next) {
  try {
    // Normalizar campos — aceptar ambos formatos
    const nombre          = req.body.nombre      || req.body.fullName;
    const email           = req.body.email;
    const celular         = req.body.celular      || req.body.phone;
    const fechaNacimiento = req.body.fechaNacimiento || req.body.birthDate;
    const plan            = req.body.plan;

    if (!nombre || !email || !celular || !fechaNacimiento || !plan) {
      return res.status(422).json({ error: 'Todos los campos son requeridos' });
    }

    const planKey = plan.toLowerCase();
    const valor   = PLAN_PRICES[planKey] / 100;
    if (!valor) return res.status(400).json({ error: `Plan inválido: ${plan}` });

    const clientTransactionId = uuidv4();

    // 1. Crear transacción en PayPhone
    const { payPhoneTransactionId, cajitaUrl } = await createTransaction({
      nombre,
      email,
      celular,
      plan,
      clientTransactionId,
    });

    // 2. Guardar en Supabase
    await savePendingPayment({
      preferenceId: clientTransactionId,
      nombre,
      email,
      celular,
      fechaNacimiento,
      plan,
      valor,
    });

    return res.json({
      clientTransactionId,
      payPhoneTransactionId,
      cajitaUrl,
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { createPayment };
