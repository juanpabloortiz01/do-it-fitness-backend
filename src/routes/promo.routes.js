const express = require('express');
const router  = express.Router();
const { validatePromo } = require('../controllers/promo.controller');

// GET /api/promo/validate?code=...
router.get('/validate', validatePromo);

module.exports = router;
