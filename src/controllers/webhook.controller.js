const { confirmTransaction }                        = require('../services/payphone.service');
const { emailExists, insertMember }                 = require('../services/sheets.service');
const { sendConfirmationEmail }                     = require('../services/email.service');
const supabase                                      = require('../config/supabase');

/**
 * GET /api/payment/confirm
 * PayPhone redirige al frontend con ?transactionId=...&clientTransactionId=...
 * El frontend llama a este endpoint para confirmar el pago con PayPhone.
 */
async function confirmPayment(req, res, next) {
  try {
    const { transactionId, clientTransactionId } = req.query;

    if (!transactionId || !clientTransactionId) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    // 1. Confirmar con PayPhone
    const { approved, statusMessage } = await confirmTransaction({
      transactionId,
      clientTransactionId,
    });

    if (!approved) {
      return res.status(400).json({
        success: false,
        message: `Pago no aprobado: ${statusMessage}`,
      });
    }

    // 2. Buscar los datos del cliente en Supabase
    const { data: pending, error } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('mp_preference_id', clientTransactionId) // guardamos el clientTransactionId en este campo
      .eq('status', 'pending')
      .single();

    if (error || !pending) {
      console.warn(`⚠️  Pago confirmado pero sin pending_payment: ${clientTransactionId}`);
      return res.status(404).json({ error: 'Registro de pago no encontrado' });
    }

    // 3. Determinar si es nuevo o renovación
    const isNew = !(await emailExists(pending.email));

    // 4. Insertar en Google Sheets
    await insertMember(pending, isNew);

    // 5. Marcar como pagado en Supabase
    await supabase
      .from('pending_payments')
      .update({ mp_payment_id: transactionId, status: 'paid' })
      .eq('mp_preference_id', clientTransactionId);

    // 6. Enviar email de confirmación
    await sendConfirmationEmail(pending, isNew);

    console.log(`✅ Membresía registrada: ${pending.email} — ${pending.plan} — ${isNew ? 'NUEVO' : 'RENOVACIÓN'}`);

    return res.json({
      success: true,
      isNew,
      message: isNew
        ? '¡Bienvenido a Do It Fitness Club!'
        : '¡Membresía renovada con éxito!',
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { confirmPayment };
