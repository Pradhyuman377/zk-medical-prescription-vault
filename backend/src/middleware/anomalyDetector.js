const prisma = require('../config/db');

// In-memory sliding window cache for rate and anomaly tracking
// Map<key, Array<timestamp>>
const accessHistory = new Map();
const fillRequestHistory = new Map();

class AnomalyDetector {
  /**
   * Helper to log security alert into database
   */
  static async recordAlert({ severity, type, details, prescriptionId, ipAddress, userId }) {
    try {
      console.warn(`🚨 [SECURITY ALERT - ${severity}] ${type}: ${details} (IP: ${ipAddress})`);
      return await prisma.securityAlert.create({
        data: {
          severity,
          type,
          details,
          prescriptionId: prescriptionId || null,
          ipAddress: ipAddress || 'unknown',
          userId: userId || null
        }
      });
    } catch (err) {
      console.error('Failed to log security alert to database:', err);
    }
  }

  /**
   * Middleware to monitor rapid prescription access and fill requests
   */
  static monitorPrescriptionRequests() {
    return async (req, res, next) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const prescriptionId = req.params.id;
      const now = Date.now();

      // 1. Check for rapid IP burst requests across endpoints
      const ipKey = `ip:${ip}`;
      const timestamps = accessHistory.get(ipKey) || [];
      const recentTimestamps = timestamps.filter(t => now - t < 10000); // 10s window
      recentTimestamps.push(now);
      accessHistory.set(ipKey, recentTimestamps);

      if (recentTimestamps.length > 20) {
        await AnomalyDetector.recordAlert({
          severity: 'HIGH',
          type: 'RATE_LIMIT_BURST',
          details: `Unusual burst activity detected: ${recentTimestamps.length} requests in 10s from IP: ${ip}`,
          ipAddress: ip,
          userId: req.user ? req.user.id : null
        });
      }

      // 2. Check for rapid fill attempts on a specific prescription
      if (prescriptionId && req.path.includes('/dispense')) {
        const fillKey = `fill:${prescriptionId}`;
        const fillTimestamps = fillRequestHistory.get(fillKey) || [];
        const recentFills = fillTimestamps.filter(t => now - t < 30000); // 30s window
        recentFills.push(now);
        fillRequestHistory.set(fillKey, recentFills);

        if (recentFills.length > 2) {
          await AnomalyDetector.recordAlert({
            severity: 'CRITICAL',
            type: 'RAPID_FILL_ATTEMPT',
            details: `Multiple rapid dispense/fill requests detected for prescription ID: ${prescriptionId} within 30 seconds. Potential duplicate drug claiming attack.`,
            prescriptionId: prescriptionId,
            ipAddress: ip,
            userId: req.user ? req.user.id : null
          });
        }
      }

      next();
    };
  }
}

module.exports = AnomalyDetector;
