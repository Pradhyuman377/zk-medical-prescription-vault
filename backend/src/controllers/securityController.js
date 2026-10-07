const prisma = require('../config/db');

class SecurityController {
  static async getAlerts(req, res) {
    try {
      const alerts = await prisma.securityAlert.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50
      });
      return res.json({ alerts });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAuditLogs(req, res) {
    try {
      const logs = await prisma.prescriptionAudit.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
          user: { select: { name: true, email: true, role: true } },
          prescription: { select: { patientName: true, doctorName: true } }
        }
      });
      return res.json({ logs });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Evaluator Demo Tool: Intentionally corrupts a prescription's dataHash
   * to prove that the cryptographic tamper detection works in real-time.
   */
  static async simulateTamperAttack(req, res) {
    try {
      const { id } = req.params;
      const prescription = await prisma.prescription.findUnique({ where: { id } });
      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found.' });
      }

      // Mutate dataHash to simulate an unauthorized DB modification
      const corruptedHash = prescription.dataHash.slice(0, -6) + 'bad000';
      await prisma.prescription.update({
        where: { id },
        data: { dataHash: corruptedHash }
      });

      return res.json({
        message: 'ATTACK SIMULATION: Database record corrupted intentionally. Next time this prescription is accessed, the SHA-256 fingerprint check will FAIL.',
        originalHash: prescription.dataHash,
        corruptedHash
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SecurityController;
