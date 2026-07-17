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
    const promoCode           = req.body.promoCode || req.body.promo_code;

    // Campos de encuesta opcionales/promocionales
    const objetivo         = req.body.objetivo;
    const nivelExperiencia = req.body.nivelExperiencia || req.body.nivel_experiencia;
    const horario          = req.body.horario;
    const tipoActividad    = req.body.tipoActividad    || req.body.tipo_actividad;
    const ocupacion        = req.body.ocupacion;

    if (!nombre || !email || !celular || !fechaNacimiento || !plan || !clientTransactionId) {
      return res.status(422).json({ error: 'Todos los campos son requeridos' });
    }

    const planKey = plan.toLowerCase();
    const valor   = PLAN_PRICES[planKey] / 100;
    if (!valor) return res.status(400).json({ error: `Plan inválido: ${plan}` });

    // Si es plan de promoción, validar el código
    if (planKey === 'promo') {
      if (!promoCode) {
        return res.status(422).json({ error: 'El código promocional es requerido para este plan' });
      }

      const { getPromoByCode } = require('../services/supabase.service');
      const promo = await getPromoByCode(promoCode.trim().toUpperCase());

      if (!promo) {
        return res.status(400).json({ error: 'El código promocional no es válido' });
      }
      if (promo.used) {
        return res.status(400).json({ error: 'El código promocional ya ha sido utilizado' });
      }
    }

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
      promoCode: promoCode ? promoCode.trim().toUpperCase() : null,
      objetivo,
      nivel_experiencia: nivelExperiencia,
      horario,
      tipo_actividad: tipoActividad,
      ocupacion,
    });

    console.log(`💾 Pago pendiente guardado: ${email} — ${plan} — ${clientTransactionId} ${promoCode ? `— Promo: ${promoCode}` : ''}`);

    return res.json({ success: true, clientTransactionId });

  } catch (error) {
    console.error('❌ Error en createPayment:', error.message);
    next(error);
  }
}
 
module.exports = { createPayment };
