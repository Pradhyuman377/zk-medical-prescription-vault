const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const AnomalyDetector = require('../middleware/anomalyDetector');

// Rate limiter: Max 10 login attempts per IP per 15 minutes
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await AnomalyDetector.recordAlert({
      severity: 'HIGH',
      type: 'BRUTE_FORCE_DETECTED',
      details: `Authentication rate limit exceeded: More than 10 login attempts within 15 minutes from IP: ${ip}`,
      ipAddress: String(ip),
      userId: null
    });

    return res.status(429).json({
      error: 'Too many login attempts from this IP address. Please try again in 15 minutes.'
    });
  }
});

router.post('/register', AuthController.register);
router.post('/login', loginRateLimiter, AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;

