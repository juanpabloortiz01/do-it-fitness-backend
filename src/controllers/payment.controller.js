const { createTransaction, PLAN_PRICES } = require('../services/payphone.service');
const { savePendingPayment }             = require('../services/supabase.service');
const { v4: uuidv4 }                     = require('uuid');

/**
 * POST /api/payment/create
 * Recibe los datos del formulario, crea la transacción en PayPhone
 * y guarda el registro pendiente en Supabase.
 */
async function createPayment(req, res, next) {
  try {
    const { nombre, email, celular, fechaNacimiento, plan } = req.body;

    const planKey = plan.toLowerCase();
    const valor   = PLAN_PRICES[planKey] / 100; // convertir centavos a dólares para guardar
    if (!valor) return res.status(400).json({ error: `Plan inválido: ${plan}` });

    // ID único para vincular PayPhone con Supabase
    const clientTransactionId = uuidv4();

    // 1. Crear transacción en PayPhone
    const { payPhoneTransactionId, cajitaUrl } = await createTransaction({
      nombre,
      email,
      celular,
      plan,
      clientTransactionId,
    });

    // 2. Guardar datos temporales en Supabase
    await savePendingPayment({
      preferenceId: clientTransactionId, // reutilizamos el campo con nuestro ID único
      nombre,
      email,
      celular,
      fechaNacimiento,
      plan,
      valor,
    });

    // 3. Devolver la URL de la cajita y los IDs al frontend
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
