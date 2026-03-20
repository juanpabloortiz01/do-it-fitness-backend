const { prepareTransaction, PLAN_PRICES } = require('../services/payphone.service');
const { savePendingPayment }              = require('../services/supabase.service');
const { v4: uuidv4 }                      = require('uuid');

/**
 * POST /api/payment/create
 * Prepara la transacción en PayPhone y guarda en Supabase.
 * Devuelve transactionId y clientTransactionId al frontend
 * para que renderice la cajita de PayPhone directamente.
 */
async function createPayment(req, res, next) {
  try {
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

    // 1. Preparar transacción en PayPhone
    const { transactionId } = await prepareTransaction({
      nombre, email, celular, plan, clientTransactionId,
    });

    // 2. Guardar en Supabase
    await savePendingPayment({
      preferenceId: clientTransactionId,
      nombre, email, celular, fechaNacimiento, plan, valor,
    });

    // 3. Devolver IDs al frontend para renderizar la cajita
    return res.json({
      transactionId,
      clientTransactionId,
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { createPayment };
