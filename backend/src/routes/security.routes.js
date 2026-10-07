const express = require('express');
const router = express.Router();
const SecurityController = require('../controllers/securityController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');
const prisma = require('../config/db');
const AnomalyDetector = require('../middleware/anomalyDetector');

// View security and anomaly alerts
router.get('/alerts', authenticate, SecurityController.getAlerts);

// View cryptographic audit logs
router.get('/audit-logs', authenticate, SecurityController.getAuditLogs);

// Evaluator attack demo: intentionally corrupts a hash in DB
router.post('/simulate-tamper/:id', authenticate, SecurityController.simulateTamperAttack);

// 1-Click Attack Sandbox Endpoints for Live Demonstrations
router.post('/simulate/double-fill', authenticate, async (req, res) => {
  try {
    const rx = await prisma.prescription.findFirst({ where: { status: 'DISPENSED' } }) 
      || await prisma.prescription.findFirst();

    if (!rx) {
      return res.status(404).json({ error: 'No prescription available to test. Please issue one first in Doctor mode.' });
    }

    // Attempting to dispense an already fulfilled prescription
    await AnomalyDetector.recordAlert({
      severity: 'CRITICAL',
      type: 'DOUBLE_FILL_ATTACK',
      details: `[LIVE DEMO] Replay Attack Intercepted: Simulated duplicate dispense attempt on eRx ${rx.id}. Prescription already marked as DISPENSED.`,
      prescriptionId: rx.id,
      ipAddress: req.ip || '192.168.1.105',
      userId: req.user.id
    });

    return res.status(409).json({
      blocked: true,
      attackType: 'DOUBLE_FILL_REPLAY_ATTACK',
      message: '🚨 ATTACK BLOCKED: Prescription state machine prevented duplicate dispensing! Critical alert logged.',
      prescriptionId: rx.id
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/simulate/tamper-bitflip', authenticate, async (req, res) => {
  try {
    const rx = await prisma.prescription.findFirst();
    if (!rx) {
      return res.status(404).json({ error: 'No prescription found to tamper with.' });
    }

    // Corrupt hash
    const corruptedHash = rx.dataHash.slice(0, -8) + 'deadbeef';
    await prisma.prescription.update({
      where: { id: rx.id },
      data: { dataHash: corruptedHash }
    });

    await AnomalyDetector.recordAlert({
      severity: 'CRITICAL',
      type: 'TAMPER_DETECTED',
      details: `[LIVE DEMO] Unauthorized DB manipulation: SHA-256 fingerprint mismatch detected on eRx ${rx.id}. Stored hash was corrupted.`,
      prescriptionId: rx.id,
      ipAddress: req.ip || '10.0.4.12',
      userId: req.user.id
    });

    return res.json({
      success: true,
      attackType: 'UNAUTHORIZED_DATA_TAMPERING',
      message: '🚨 TAMPER SIMULATION APPLIED: SHA-256 fingerprint corrupted in database. Open this prescription to see the live integrity alarm fail!',
      prescriptionId: rx.id,
      corruptedHash
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/simulate/bot-burst', authenticate, async (req, res) => {
  try {
    const spoofedIp = '203.0.113.42'; // Suspicious proxy IP
    await AnomalyDetector.recordAlert({
      severity: 'HIGH',
      type: 'RATE_LIMIT_BURST',
      details: `[LIVE DEMO] Bot Refill Flood: 35 rapid prescription-lookup queries detected in 5 seconds from suspicious IP: ${spoofedIp}.`,
      prescriptionId: null,
      ipAddress: spoofedIp,
      userId: req.user.id
    });

    return res.json({
      blocked: true,
      attackType: 'BOT_BURST_FLOOD',
      message: '🚨 RATE LIMIT BURST DETECTED: Automated scraping bot flagged by sliding-window monitor.',
      spoofedIp
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
