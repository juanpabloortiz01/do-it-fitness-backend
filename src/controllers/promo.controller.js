const { getPromoByCode } = require('../services/supabase.service');

/**
 * GET /api/promo/validate?code=DOIT-JUAN-842
 * Valida si un código promocional existe y no ha sido utilizado.
 */
async function validatePromo(req, res, next) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'El código de descuento es requerido' });
    }

    const promo = await getPromoByCode(code.trim().toUpperCase());

    if (!promo) {
      return res.status(404).json({
        valid: false,
        error: 'El código de descuento ingresado no es válido o no existe.',
      });
    }

    if (promo.used) {
      return res.status(400).json({
        valid: false,
        error: 'Este código de descuento ya ha sido utilizado.',
      });
    }

    return res.json({
      valid: true,
      promo: {
        client_name:  promo.client_name,
        phone_number: promo.phone_number,
        promo_code:   promo.promo_code,
        claimed:      promo.claimed,
        used:         promo.used,
        goal:         promo.goal,
      },
    });

  } catch (error) {
    console.error('❌ Error al validar código promocional:', error.message);
    next(error);
  }
}

module.exports = { validatePromo };
