const rateLimit = require('express-rate-limit');
 
// Máximo 5 intentos de pago por IP cada hora
const paymentLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hora
  max:              5,
  message:          { error: 'Demasiados intentos. Intenta de nuevo en una hora.' },
  standardHeaders:  true,
  legacyHeaders:    false,
  keyGenerator:     (req) => req.ip,
});
 
// Máximo 20 requests generales por IP cada 15 minutos
const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutos
  max:              20,
  message:          { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
  standardHeaders:  true,
  legacyHeaders:    false,
});
 
module.exports = { paymentLimiter, generalLimiter };
