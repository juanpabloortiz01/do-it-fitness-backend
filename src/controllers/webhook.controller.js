const { confirmTransaction }        = require('../services/payphone.service');
const { emailExists, insertMember } = require('../services/sheets.service');
const {
  getPendingByPreferenceId,
  updatePaymentId,
  markAsPaid,
  isAlreadyPaid,
  markPromoAsUsed,
} = require('../services/supabase.service');

async function confirmPayment(req, res, next) {
  try {
    const transactionId       = req.query.transactionId || req.query.id;
    const clientTransactionId = req.query.clientTransactionId;

    console.log('📥 Confirm params:', { transactionId, clientTransactionId });

    if (!transactionId || !clientTransactionId) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    // 1. Buscar datos en PostgreSQL
    const pending = await getPendingByPreferenceId(clientTransactionId);

    if (!pending) {
      console.warn(`⚠️  Sin pending_payment para: ${clientTransactionId}`);
      return res.status(404).json({ error: 'Registro de pago no encontrado' });
    }

    // 2. Guardar payment_id siempre para trazabilidad
    await updatePaymentId(clientTransactionId, transactionId);
    console.log(`💾 Payment ID guardado: ${transactionId}`);

    // 3. Verificar con PayPhone
    let approved = false;
    try {
      const result = await confirmTransaction({ transactionId, clientTransactionId });
      approved     = result.approved;
      console.log('📥 PayPhone confirm result:', result);
    } catch (ppError) {
      console.error('❌ PayPhone confirm error:', ppError.message);
      return res.status(402).json({ error: 'No se pudo verificar el pago con PayPhone' });
    }

    if (!approved) {
      console.warn(`⚠️  Pago no aprobado: ${transactionId}`);
      return res.status(402).json({ success: false, message: 'Pago no aprobado o cancelado' });
    }

    // 4. Verificar idempotencia
    const alreadyPaid = await isAlreadyPaid(clientTransactionId);
    if (alreadyPaid) {
      return res.json({ success: true, message: 'Pago ya procesado anteriormente' });
    }

    // 5. Determinar nuevo o renovación
    const isNew = !(await emailExists(pending.email));
    console.log(`👤 ${pending.email} — isNew: ${isNew}`);

    // 6. Insertar en Google Sheets
    await insertMember(pending, isNew);
    console.log(`📝 Insertado en Sheets`);

    // 6.5. Si tiene un código promocional asociado, marcarlo como usado
    if (pending.promo_code) {
      await markPromoAsUsed(pending.promo_code);
      console.log(`🎟️ Código promocional ${pending.promo_code} marcado como usado`);
    }

    // 7. Marcar como pagado
    await markAsPaid(clientTransactionId);

    console.log(`✅ Membresía registrada: ${pending.email} — ${pending.plan} — ${isNew ? 'NUEVO' : 'RENOVACIÓN'}`);

    return res.json({
      success: true,
      isNew,
      message: isNew ? '¡Bienvenido a Do It Fitness Club!' : '¡Membresía renovada con éxito!',
    });

  } catch (error) {
    console.error('❌ Error en confirmPayment:', error.message);
    next(error);
  }
}

module.exports = { confirmPayment };
