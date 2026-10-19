const prisma = require('../config/db');
const CryptoService = require('./cryptoService');

class AuditService {
  /**
   * TASK 10: Blockchain-Style Immutable Audit Hash Chain
   * Creates an audit entry linked to the previous entry via SHA-256 hash pointer.
   */
  static async recordAudit({ prescriptionId, userId, userRole, action, ipAddress, userAgent }) {
    try {
      const timestamp = new Date();

      // 1. Fetch most recent audit entry in the chain
      const lastAudit = await prisma.prescriptionAudit.findFirst({
        orderBy: { timestamp: 'desc' }
      });

      // 2. Genesis block handling
      const previousHash = lastAudit && lastAudit.entryHash ? lastAudit.entryHash : 'GENESIS';

      // 3. Compute entryHash = SHA256(action + prescriptionId + userId + timestamp.toISOString() + previousHash)
      const dataToHash = `${action}:${prescriptionId || 'NONE'}:${userId || 'SYSTEM'}:${timestamp.toISOString()}:${previousHash}`;
      const entryHash = CryptoService.computeSHA256(dataToHash);

      // 4. Persist audit log
      return await prisma.prescriptionAudit.create({
        data: {
          prescriptionId,
          userId,
          userRole,
          action,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'VaultClient/1.0',
          timestamp,
          entryHash,
          previousHash
        }
      });
    } catch (err) {
      console.error('Failed to record blockchain audit entry:', err);
    }
  }

  /**
   * TASK 10: Verifies the integrity of the entire audit chain from genesis to head
   */
  static async verifyAuditChain() {
    try {
      const logs = await prisma.prescriptionAudit.findMany({
        orderBy: { timestamp: 'asc' }
      });

      if (logs.length === 0) {
        return {
          chainValid: true,
          totalEntries: 0,
          brokenAtIndex: -1,
          details: 'Audit chain is empty. No entries to verify.'
        };
      }

      let previousExpectedHash = 'GENESIS';

      for (let i = 0; i < logs.length; i++) {
        const entry = logs[i];

        // 1. Verify link to previous entry
        if (entry.previousHash !== previousExpectedHash) {
          return {
            chainValid: false,
            totalEntries: logs.length,
            brokenAtIndex: i,
            failedEntryId: entry.id,
            reason: `Broken chain link at index ${i}: expected previousHash ${previousExpectedHash}, but found ${entry.previousHash}`
          };
        }

        // 2. Recompute and verify current entry's hash
        const expectedData = `${entry.action}:${entry.prescriptionId}:${entry.userId}:${new Date(entry.timestamp).toISOString()}:${entry.previousHash}`;
        const recomputedHash = CryptoService.computeSHA256(expectedData);

        if (entry.entryHash !== recomputedHash) {
          return {
            chainValid: false,
            totalEntries: logs.length,
            brokenAtIndex: i,
            failedEntryId: entry.id,
            reason: `Tampered log payload at index ${i}: stored hash does not match content fingerprint.`
          };
        }

        previousExpectedHash = entry.entryHash;
      }

      return {
        chainValid: true,
        totalEntries: logs.length,
        brokenAtIndex: -1,
        latestHash: previousExpectedHash,
        verifiedAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('Audit chain verification error:', err);
      return {
        chainValid: false,
        totalEntries: 0,
        brokenAtIndex: -1,
        error: err.message
      };
    }
  }
}

module.exports = AuditService;
