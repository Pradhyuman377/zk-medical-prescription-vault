const express = require('express');
const router = express.Router();
const SecurityController = require('../controllers/securityController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

// View security and anomaly alerts
router.get('/alerts', authenticate, SecurityController.getAlerts);

// View cryptographic audit logs
router.get('/audit-logs', authenticate, SecurityController.getAuditLogs);

// Evaluator attack demo: intentionally corrupts a hash in DB
router.post('/simulate-tamper/:id', authenticate, authorizeRoles('AUDITOR', 'DOCTOR'), SecurityController.simulateTamperAttack);

module.exports = router;
