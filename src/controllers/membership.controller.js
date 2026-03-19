const { emailExists } = require('../services/sheets.service');

/**
 * GET /api/membership/check?email=juan@mail.com
 * El frontend puede llamar a esto para mostrar un mensaje
 * de bienvenida antes del pago ("¡Bienvenido de vuelta!")
 */
async function checkMembership(req, res, next) {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const exists = await emailExists(email);
    return res.json({
      isReturning: exists,
      message: exists
        ? '¡Bienvenido de vuelta! Tu renovación se procesará automáticamente.'
        : '¡Bienvenido a Do It Fitness Club!',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { checkMembership };
