const express = require('express');
const router  = express.Router();
const { checkMembership } = require('../controllers/membership.controller');

// GET /api/membership/check?email=...
router.get('/check', checkMembership);

module.exports = router;
