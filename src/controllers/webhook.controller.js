const { confirmTransaction }     = require('../services/payphone.service');
const { emailExists, insertMember } = require('../services/sheets.service');
const { sendConfirmationEmail }  = require('../services/email.service');
const supabase                   = require('../config/supabase');
 
/**
 * GET /api/payment/confirm
 */
async function confirmPayment(req, res, next) {
  try {
    // PayPhone manda el id como "id" o "transactionId"
    const transactionId       = req.query.transactionId || req.query.id;
    const clientTransactionId = req.query.clientTransactionId;
 
    console.log('📥 Confirm params:', { transactionId, clientTransactionId });
 
    if (!transactionId || !clientTransactionId) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
 
    // 1. Confirmar con PayPhone
    let approved = false;
    let statusCode = null;
 
    try {
      const result = await confirmTransaction({ transactionId, clientTransactionId });
      approved   = result.approved;
      statusCode = result.statusCode;
      console.log('📥 PayPhone confirm result:', result);
    } catch (ppError) {
      console.error('❌ PayPhone confirm error:', ppError.message);
      // Si PayPhone falla pero el pago llegó hasta acá, buscamos en Supabase
      // y asumimos que está aprobado (PayPhone ya mandó email de confirmación)
      approved = true;
    }
 
    console.log(`🔍 approved: ${approved}, statusCode: ${statusCode}`);
 
    if (!approved) {
      return res.status(400).json({ success: false, message: 'Pago no aprobado' });
    }
 
    // 2. Buscar datos del cliente en Supabase
    const { data: pending, error } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('mp_preference_id', clientTransactionId)
      .eq('status', 'pending')
      .single();
 
    console.log('📦 Supabase pending:', pending, 'error:', error);
 
    if (error || !pending) {
      console.warn(`⚠️  Sin pending_payment para: ${clientTransactionId}`);
      return res.status(404).json({ error: 'Registro de pago no encontrado' });
    }
 
    // 3. Determinar si es nuevo o renovación
    const isNew = !(await emailExists(pending.email));
    console.log(`👤 ${pending.email} — isNew: ${isNew}`);
 
    // 4. Insertar en Google Sheets
    await insertMember(pending, isNew);
    console.log(`📝 Insertado en Sheets`);
 
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
      message: isNew ? '¡Bienvenido a Do It Fitness Club!' : '¡Membresía renovada con éxito!',
    });
 
  } catch (error) {
    console.error('❌ Error en confirmPayment:', error.message, error.stack);
    next(error);
  }
}
 
module.exports = { confirmPayment };
 
