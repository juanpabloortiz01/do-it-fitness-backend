const { confirmTransaction }        = require('../services/payphone.service');
const { emailExists, insertMember } = require('../services/sheets.service');
const { sendConfirmationEmail }     = require('../services/email.service');
const supabase                      = require('../config/supabase');

async function confirmPayment(req, res, next) {
  try {
    const transactionId       = req.query.transactionId || req.query.id;
    const clientTransactionId = req.query.clientTransactionId;

    console.log('📥 Confirm params:', { transactionId, clientTransactionId });

    if (!transactionId || !clientTransactionId) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    // 1. Buscar datos en Supabase PRIMERO
    const { data: pending, error } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('mp_preference_id', clientTransactionId)
      .eq('status', 'pending')
      .single();

    if (error || !pending) {
      console.warn(`⚠️  Sin pending_payment para: ${clientTransactionId}`);
      return res.status(404).json({ error: 'Registro de pago no encontrado' });
    }

    // 2. Actualizar Supabase con el payment_id SIEMPRE (para trazabilidad)
    await supabase
      .from('pending_payments')
      .update({ mp_payment_id: transactionId })
      .eq('mp_preference_id', clientTransactionId);

    console.log(`💾 Payment ID guardado en Supabase: ${transactionId}`);

    // 3. Verificar con PayPhone
    let approved = false;
    try {
      const result = await confirmTransaction({ transactionId, clientTransactionId });
      approved     = result.approved;
      console.log('📥 PayPhone confirm result:', result);
    } catch (ppError) {
      console.error('❌ PayPhone confirm error:', ppError.message);
      // En sandbox PayPhone falla — no escribimos en Sheets
      return res.status(402).json({ 
        error: 'No se pudo verificar el pago con PayPhone',
        sandbox: true 
      });
    }

    if (!approved) {
      console.warn(`⚠️  Pago no aprobado: transactionId=${transactionId}`);
      return res.status(402).json({ success: false, message: 'Pago no aprobado' });
    }

    // 4. Verificar idempotencia
    const { data: alreadyPaid } = await supabase
      .from('pending_payments')
      .select('status')
      .eq('mp_preference_id', clientTransactionId)
      .eq('status', 'paid')
      .single();

    if (alreadyPaid) {
      return res.json({ success: true, message: 'Pago ya procesado anteriormente' });
    }

    // 5. Determinar nuevo o renovación
    const isNew = !(await emailExists(pending.email));
    console.log(`👤 ${pending.email} — isNew: ${isNew}`);

    // 6. Insertar en Google Sheets
    await insertMember(pending, isNew);
    console.log(`📝 Insertado en Sheets`);

    // 7. Marcar como pagado en Supabase
    await supabase
      .from('pending_payments')
      .update({ status: 'paid' })
      .eq('mp_preference_id', clientTransactionId);

    // 8. Enviar email
    try {
      await sendConfirmationEmail(pending, isNew);
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
    }

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
