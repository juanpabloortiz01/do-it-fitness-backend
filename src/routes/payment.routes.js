const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { createPayment } = require('../controllers/payment.controller');
const { confirmPayment } = require('../controllers/webhook.controller');
const validate = require('../middlewares/validate');
const { paymentLimiter } = require('../middlewares/rateLimiter');
 
// POST /api/payment/create — máximo 5 intentos por IP por hora
router.post('/create', paymentLimiter, [
  body('plan')
    .notEmpty()
    .isIn(['mensual','trimestral','semestral','anual'])
    .withMessage('Plan inválido'),
  validate,
], createPayment);
 
// GET /api/payment/confirm
router.get('/confirm', confirmPayment);
 
module.exports = router;
