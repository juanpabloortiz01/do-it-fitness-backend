require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
 
const paymentRoutes    = require('./routes/payment.routes');
const membershipRoutes = require('./routes/membership.routes');
const errorHandler     = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');
 
const app  = express();
const PORT = process.env.PORT || 3000;
 
// ── Middlewares globales ───────────────────────────────
app.use(morgan('dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// Rate limiting general a todas las rutas
app.use(generalLimiter);
 
// ── Rutas ─────────────────────────────────────────────
app.use('/api/payment',    paymentRoutes);
app.use('/api/membership', membershipRoutes);
 
// Health check (sin rate limit)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
 
// ── Error handler global ──────────────────────────────
app.use(errorHandler);
 
app.listen(PORT, () => {
  console.log(`🏋️  Do It Fitness Backend corriendo en puerto ${PORT}`);
});
