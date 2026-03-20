const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { createPayment } = require('../controllers/payment.controller');
const { confirmPayment } = require('../controllers/webhook.controller');
const validate = require('../middlewares/validate');

// POST /api/payment/create — Inicia el pago
// Acepta tanto los nombres del frontend (fullName, phone, birthDate)
// como los del backend (nombre, celular, fechaNacimiento)
router.post('/create', [
  body(['nombre', 'fullName']).optional().trim(),
  body('email').isEmail().withMessage('Email inválido'),
  body(['celular', 'phone']).optional().trim(),
  body(['fechaNacimiento', 'birthDate']).optional(),
  body('plan')
    .notEmpty()
    .isIn(['mensual','trimestral','semestral','anual'])
    .withMessage('Plan inválido'),
  validate,
], createPayment);

// GET /api/payment/confirm — PayPhone redirige aquí tras el pago
router.get('/confirm', confirmPayment);

module.exports = router;
