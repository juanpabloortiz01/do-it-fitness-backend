const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { createPayment } = require('../controllers/payment.controller');
const { confirmPayment } = require('../controllers/webhook.controller');
const validate = require('../middlewares/validate');

// POST /api/payment/create — Inicia el pago
router.post('/create', [
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('celular').trim().notEmpty().withMessage('Celular es requerido'),
  body('fechaNacimiento').notEmpty().withMessage('Fecha de nacimiento requerida'),
  body('plan')
    .notEmpty()
    .isIn(['mensual','trimestral','semestral','anual'])
    .withMessage('Plan inválido'),
  validate,
], createPayment);

// GET /api/payment/confirm — PayPhone redirige aquí tras el pago
router.get('/confirm', confirmPayment);

module.exports = router;
