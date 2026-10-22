const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const CryptoService = require('../services/cryptoService');
const OCRClient = require('../services/ocrClient');
const AnomalyDetector = require('../middleware/anomalyDetector');
const AuditService = require('../services/auditService');

class PrescriptionController {
  /**
   * Accepts uploaded slip, forwards to Python AI service, returns extracted entities with confidence
   */
  static async uploadAndExtractOCR(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No prescription slip image uploaded.' });
      }

      const ocrResult = await OCRClient.extractPrescription(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.json({
        message: 'Prescription processed by AI OCR microservice successfully.',
        data: ocrResult
      });
    } catch (error) {
      console.error('OCR Controller Error:', error);
      return res.status(500).json({ error: 'OCR Processing failed: ' + error.message });
    }
  }

  /**
   * TASK 8: Drug-Drug Interaction Checker endpoint
   */
  static async checkInteractions(req, res) {
    try {
      const { medications } = req.body;
      if (!medications || !Array.isArray(medications)) {
        return res.status(400).json({ error: 'Medications list is required.' });
      }

      const result = await OCRClient.checkInteractions(medications);
      return res.json(result);
    } catch (error) {
      console.error('Interaction checker error:', error);
      return res.status(500).json({ error: 'Interaction check failed: ' + error.message });
    }
  }

  /**
   * Doctor issues and cryptographically seals a prescription
   * Supports:
   * - RSA-2048 Digital Signatures (with private key decrypted from vault at rest)
   * - ECDH secp256k1 Key Agreement (pairwise AES-256-GCM encryption)
   * - Blockchain-style Immutable Audit Hash Chain
   */
  static async issuePrescription(req, res) {
    try {
      const {
        patientId,
        patientName,
        patientEmail,
        clinicName,
        dateIssued,
        diagnosis,
        medications
      } = req.body;

      if (!patientName || !medications || !Array.isArray(medications) || medications.length === 0) {
        return res.status(400).json({ error: 'Patient name and at least one medication are required.' });
      }

      if (!patientEmail || !patientEmail.trim()) {
        return res.status(400).json({ error: 'Patient email address is mandatory for prescription issuance.' });
      }
      const cleanPatientEmail = patientEmail.trim().toLowerCase();

      // Fetch issuing doctor with encrypted keys
      const doctor = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!doctor || doctor.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only registered medical doctors can issue prescriptions.' });
      }

      // Resolve patient by mandatory unique email
      let patient = null;
      if (patientId) {
        patient = await prisma.user.findUnique({ where: { id: patientId } });
      }
      if (!patient && cleanPatientEmail) {
        patient = await prisma.user.findUnique({ where: { email: cleanPatientEmail } });
      }
      const resolvedPatientId = patient ? patient.id : doctor.id;

      // 1. Construct canonical data object for integrity hashing
      const canonicalRecord = {
        patientName,
        patientEmail: cleanPatientEmail,
        doctorName: doctor.name,
        doctorLicense: doctor.licenseNumber || 'N/A',
        clinicName: clinicName || doctor.clinic || 'Medical Clinic',
        dateIssued: dateIssued || new Date().toISOString().split('T')[0],
        diagnosis: diagnosis || 'General Clinical Evaluation',
        medications: medications
      };

      // 2. Generate SHA-256 Tamper-Evident Fingerprint
      const dataHash = CryptoService.computeSHA256(canonicalRecord);

      // 3. TASK 5: Decrypt Doctor RSA Private Key from vault at rest, then sign
      // Production: Use HSM/KMS for private key storage
      let doctorSignature = 'MOCK_SIGNATURE';
      if (doctor.privateKey) {
        try {
          const decryptedRsaPriv = CryptoService.decryptPrivateKey(doctor.privateKey);
          doctorSignature = CryptoService.signHash(dataHash, decryptedRsaPriv);
        } catch (signErr) {
          console.warn('Signing with stored key failed, using fallback signature:', signErr.message);
          doctorSignature = CryptoService.computeSHA256(dataHash + doctor.id);
        }
      }

      // 4. TASK 12: ECDH pairwise key agreement
      let encryptionKey = null;
      let keyExchangeUsed = 'MASTER_KEY';

      if (doctor.ecdhPrivateKey && patient && patient.ecdhPublicKey) {
        try {
          const decryptedDoctorEcdhPriv = CryptoService.decryptPrivateKey(doctor.ecdhPrivateKey);
          encryptionKey = CryptoService.deriveSharedSecret(decryptedDoctorEcdhPriv, patient.ecdhPublicKey);
          keyExchangeUsed = 'ECDH-secp256k1';
        } catch (ecdhErr) {
          console.warn('ECDH derivation failed, falling back to master vault key:', ecdhErr.message);
        }
      }

      // Encrypt diagnosis and medications separately to facilitate Selective Disclosure (Zero-Knowledge)
      const encryptedDiagnosis = encryptionKey 
        ? CryptoService.encryptAES256GCM(canonicalRecord.diagnosis, encryptionKey)
        : CryptoService.encryptAES256GCM(canonicalRecord.diagnosis);

      const encryptedMedications = encryptionKey
        ? CryptoService.encryptAES256GCM(canonicalRecord.medications, encryptionKey)
        : CryptoService.encryptAES256GCM(canonicalRecord.medications);

      // 5. Store in Vault
      const prescription = await prisma.prescription.create({
        data: {
          patientId: resolvedPatientId,
          doctorId: doctor.id,
          patientName,
          patientEmail: cleanPatientEmail,
          doctorName: doctor.name,
          clinicName: canonicalRecord.clinicName,
          dateIssued: canonicalRecord.dateIssued,
          status: 'ISSUED',
          encryptedDiagnosis,
          encryptedMedications,
          keyExchangeUsed,
          dataHash,
          doctorSignature
        }
      });

      // 6. TASK 10: Record Blockchain-style Audit Log
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      await AuditService.recordAudit({
        prescriptionId: prescription.id,
        userId: req.user.id,
        userRole: req.user.role,
        action: 'ISSUED_AND_CRYPTOGRAPHICALLY_SEALED',
        ipAddress: String(ip),
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json({
        message: 'Prescription cryptographically sealed and saved to vault.',
        prescriptionId: prescription.id,
        dataHash,
        keyExchangeUsed,
        doctorSignaturePreview: doctorSignature.slice(0, 32) + '...'
      });
    } catch (error) {
      console.error('Issue prescription error:', error);
      return res.status(500).json({ error: 'Failed to issue prescription: ' + error.message });
    }
  }

  /**
   * Retrieves prescription with SELECTIVE DISCLOSURE based on RBAC:
   * - Pharmacist: Sees Medications, Doctor Signature status, Hash integrity. Diagnosis is ZERO-KNOWLEDGE (Hidden).
   * - Doctor / Patient / Auditor: Sees full diagnosis and medications.
   */
  static async getPrescriptionById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true, name: true, licenseNumber: true, clinic: true, publicKey: true, ecdhPublicKey: true, ecdhPrivateKey: true } },
          patient: { select: { id: true, name: true, email: true, ecdhPublicKey: true, ecdhPrivateKey: true } }
        }
      });

      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found in vault.' });
      }

      // RBAC Privacy Isolation: Patients can ONLY view their own prescriptions
      const isOwnerPatient = user.role === 'PATIENT' && (
        prescription.patientId === user.id ||
        (prescription.patientEmail && prescription.patientEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      );

      if (user.role === 'PATIENT' && !isOwnerPatient) {
        return res.status(403).json({
          error: 'Access Denied: You are not authorized to view another patient\'s medical record.'
        });
      }

      // Determine decryption key (ECDH derived key if keyExchangeUsed === 'ECDH-secp256k1', else Master Key)
      let decryptionKey = null;
      if (prescription.keyExchangeUsed === 'ECDH-secp256k1' && prescription.doctor && prescription.patient) {
        try {
          if (user.id === prescription.patientId && prescription.patient.ecdhPrivateKey && prescription.doctor.ecdhPublicKey) {
            const patientPriv = CryptoService.decryptPrivateKey(prescription.patient.ecdhPrivateKey);
            decryptionKey = CryptoService.deriveSharedSecret(patientPriv, prescription.doctor.ecdhPublicKey);
          } else if (prescription.doctor.ecdhPrivateKey && prescription.patient.ecdhPublicKey) {
            const docPriv = CryptoService.decryptPrivateKey(prescription.doctor.ecdhPrivateKey);
            decryptionKey = CryptoService.deriveSharedSecret(docPriv, prescription.patient.ecdhPublicKey);
          }
        } catch (keyErr) {
          console.warn('Failed to derive ECDH key, attempting master key fallback:', keyErr.message);
        }
      }

      // 1. Decrypt medications using AES-256-GCM
      let decryptedMedications = [];
      try {
        decryptedMedications = decryptionKey
          ? CryptoService.decryptAES256GCM(prescription.encryptedMedications, decryptionKey)
          : CryptoService.decryptAES256GCM(prescription.encryptedMedications);
      } catch (err) {
        // Fallback attempt with master key if custom key failed
        try {
          decryptedMedications = CryptoService.decryptAES256GCM(prescription.encryptedMedications);
        } catch (fatalErr) {
          await AnomalyDetector.recordAlert({
            severity: 'CRITICAL',
            type: 'TAMPER_DETECTED',
            details: `AES-256-GCM AuthTag validation failed for prescription ${id}. Ciphertext has been modified or corrupted!`,
            prescriptionId: id,
            ipAddress: String(ip),
            userId: user.id
          });
          return res.status(500).json({ error: 'Cryptographic tamper alarm: Data authentication tag mismatch!' });
        }
      }

      // 2. Selective Disclosure: Decrypt Diagnosis ONLY for Doctor, Patient, or Auditor
      let decryptedDiagnosis = null;
      let diagnosisDisclosed = false;

      if (user.role === 'PHARMACIST') {
        decryptedDiagnosis = '[REDACTED: Protected by Zero-Knowledge Selective Disclosure]';
        diagnosisDisclosed = false;
      } else {
        try {
          decryptedDiagnosis = decryptionKey
            ? CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis, decryptionKey)
            : CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis);
          diagnosisDisclosed = true;
        } catch (err) {
          try {
            decryptedDiagnosis = CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis);
            diagnosisDisclosed = true;
          } catch {
            decryptedDiagnosis = '[Tamper Warning: Failed to decrypt diagnosis]';
          }
        }
      }

      // 3. Real-Time Cryptographic Verification
      const rawOriginalDiagnosis = (decryptionKey
        ? (() => { try { return CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis, decryptionKey); } catch { return CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis); } })()
        : CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis));

      // Reconstruct with patientEmail if present
      const recordWithEmail = {
        patientName: prescription.patientName,
        ...(prescription.patientEmail ? { patientEmail: prescription.patientEmail.toLowerCase().trim() } : {}),
        doctorName: prescription.doctorName,
        doctorLicense: prescription.doctor?.licenseNumber || 'N/A',
        clinicName: prescription.clinicName,
        dateIssued: prescription.dateIssued,
        diagnosis: rawOriginalDiagnosis,
        medications: decryptedMedications
      };

      let computedHash = CryptoService.computeSHA256(recordWithEmail);
      let isHashValid = computedHash === prescription.dataHash;

      // Backward compatibility fallback for records issued before patientEmail was included in hash
      if (!isHashValid) {
        const recordWithoutEmail = {
          patientName: prescription.patientName,
          doctorName: prescription.doctorName,
          doctorLicense: prescription.doctor?.licenseNumber || 'N/A',
          clinicName: prescription.clinicName,
          dateIssued: prescription.dateIssued,
          diagnosis: rawOriginalDiagnosis,
          medications: decryptedMedications
        };
        const legacyHash = CryptoService.computeSHA256(recordWithoutEmail);
        if (legacyHash === prescription.dataHash) {
          computedHash = legacyHash;
          isHashValid = true;
        }
      }

      let isSignatureValid = false;
      if (prescription.doctor?.publicKey && prescription.doctorSignature) {
        isSignatureValid = CryptoService.verifySignature(
          prescription.dataHash,
          prescription.doctorSignature,
          prescription.doctor.publicKey
        );
      }

      // TASK 10: Record Blockchain-style Audit Log
      await AuditService.recordAudit({
        prescriptionId: id,
        userId: user.id,
        userRole: user.role,
        action: 'VIEWED',
        ipAddress: String(ip),
        userAgent: req.headers['user-agent']
      });

      return res.json({
        prescription: {
          id: prescription.id,
          patientName: prescription.patientName,
          doctorName: prescription.doctorName,
          clinicName: prescription.clinicName,
          dateIssued: prescription.dateIssued,
          status: prescription.status,
          dispensedByPharmacist: prescription.dispensedByPharmacist,
          dispensedAt: prescription.dispensedAt,
          diagnosis: decryptedDiagnosis,
          diagnosisDisclosed,
          medications: decryptedMedications,
          keyExchangeUsed: prescription.keyExchangeUsed || 'MASTER_KEY',
          cryptoVerification: {
            algorithm: 'AES-256-GCM + SHA-256 + RSA-2048' + (prescription.keyExchangeUsed ? ` + ${prescription.keyExchangeUsed}` : ''),
            dataHash: prescription.dataHash,
            computedHash: computedHash,
            isIntegrityValid: isHashValid,
            isDoctorSignatureValid: isSignatureValid,
            selectiveDisclosureActive: user.role === 'PHARMACIST'
          }
        }
      });
    } catch (error) {
      console.error('Get prescription error:', error);
      return res.status(500).json({ error: 'Failed to retrieve prescription: ' + error.message });
    }
  }

  /**
   * Pharmacist dispenses prescription (Guards against Double-Fill Replay Attacks & Revoked Prescriptions)
   */
  static async dispensePrescription(req, res) {
    try {
      const { id } = req.params;
      const pharmacist = req.user;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const prescription = await prisma.prescription.findUnique({
        where: { id }
      });

      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found.' });
      }

      // Check state machine: PREVENT REVOKED DISPENSE
      if (prescription.status === 'REVOKED') {
        await AnomalyDetector.recordAlert({
          severity: 'CRITICAL',
          type: 'REVOCATION_ALERT',
          details: `Attempted fulfillment of REVOKED prescription: Pharmacist ${pharmacist.name} tried to dispense revoked prescription ID ${id}.`,
          prescriptionId: id,
          ipAddress: String(ip),
          userId: pharmacist.id
        });

        return res.status(400).json({
          error: 'REVOCATION ALERT: This prescription has been REVOKED by the prescribing physician! Dispensing is strictly prohibited.',
          status: 'REVOKED'
        });
      }

      // Check state machine: PREVENT DOUBLE-FILL REPLAY ATTACK
      if (prescription.status === 'DISPENSED') {
        await AnomalyDetector.recordAlert({
          severity: 'CRITICAL',
          type: 'DOUBLE_FILL_ATTACK',
          details: `Replay attack detected: Pharmacist ${pharmacist.name} (${pharmacist.email}) attempted to dispense already-fulfilled prescription ID ${id}. Dispensed previously on ${prescription.dispensedAt}.`,
          prescriptionId: id,
          ipAddress: String(ip),
          userId: pharmacist.id
        });

        return res.status(409).json({
          error: 'SECURITY REPLAY ALERT: This prescription has ALREADY been dispensed! Duplicate fill rejected.',
          dispensedAt: prescription.dispensedAt,
          dispensedBy: prescription.dispensedByPharmacist
        });
      }

      // Mark as DISPENSED
      const updated = await prisma.prescription.update({
        where: { id },
        data: {
          status: 'DISPENSED',
          dispensedByPharmacist: `${pharmacist.name} (${pharmacist.licenseNumber || 'License R.Ph'})`,
          dispensedAt: new Date()
        }
      });

      // TASK 10: Record Blockchain-style Audit Log
      await AuditService.recordAudit({
        prescriptionId: id,
        userId: pharmacist.id,
        userRole: pharmacist.role,
        action: 'DISPENSED_MEDICATION',
        ipAddress: String(ip),
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'Prescription verified and successfully fulfilled.',
        status: updated.status,
        dispensedAt: updated.dispensedAt
      });
    } catch (error) {
      console.error('Dispense error:', error);
      return res.status(500).json({ error: 'Failed to dispense prescription: ' + error.message });
    }
  }

  /**
   * TASK 7: Prescription revocation by Doctor
   */
  static async revokePrescription(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

      if (user.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only medical doctors are authorized to revoke prescriptions.' });
      }

      const prescription = await prisma.prescription.findUnique({ where: { id } });
      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found.' });
      }

      if (prescription.status === 'DISPENSED') {
        return res.status(400).json({
          error: 'Prescription has already been DISPENSED by a pharmacy and cannot be revoked.'
        });
      }

      if (prescription.status === 'REVOKED') {
        return res.status(400).json({ error: 'Prescription is already revoked.' });
      }

      const updated = await prisma.prescription.update({
        where: { id },
        data: { status: 'REVOKED' }
      });

      // Log audit
      await AuditService.recordAudit({
        prescriptionId: id,
        userId: user.id,
        userRole: user.role,
        action: 'PRESCRIPTION_REVOKED',
        ipAddress: String(ip),
        userAgent: req.headers['user-agent']
      });

      // Log security alert
      await AnomalyDetector.recordAlert({
        severity: 'MEDIUM',
        type: 'REVOCATION_ALERT',
        details: `Prescription ID ${id} was revoked by Doctor ${user.name} (${user.email}). Status set to REVOKED.`,
        prescriptionId: id,
        ipAddress: String(ip),
        userId: user.id
      });

      return res.json({
        message: 'Prescription successfully revoked. Pharmacists will be blocked from dispensing it.',
        prescription: updated
      });
    } catch (error) {
      console.error('Revoke error:', error);
      return res.status(500).json({ error: 'Failed to revoke prescription: ' + error.message });
    }
  }

  /**
   * TASK 11: Generate QR Code for Patient Prescription Sharing
   */
  static async getPrescriptionQR(req, res) {
    try {
      const { id } = req.params;
      const prescription = await prisma.prescription.findUnique({ where: { id } });

      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found.' });
      }

      const qrDataUrl = await CryptoService.generateQRCodeDataURL(prescription.id);
      const hmac = CryptoService.generatePrescriptionHMAC(prescription.id);

      return res.json({
        prescriptionId: prescription.id,
        hmac,
        qrImage: qrDataUrl,
        instructions: 'Present this QR code to the pharmacist for instant tamper-proof verification.'
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      return res.status(500).json({ error: 'Failed to generate QR code: ' + error.message });
    }
  }

  /**
   * TASK 11: Verify QR Code Scanned by Pharmacist
   */
  static async verifyQRCode(req, res) {
    try {
      let { prescriptionId, hmac, rawPayload } = req.body;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

      if (rawPayload && typeof rawPayload === 'string') {
        try {
          const parsed = JSON.parse(rawPayload);
          prescriptionId = parsed.prescriptionId;
          hmac = parsed.hmac;
        } catch {
          // If plain ID was scanned
          prescriptionId = rawPayload.trim();
        }
      }

      if (!prescriptionId) {
        return res.status(400).json({ error: 'Prescription ID is required from QR scan.' });
      }

      // If HMAC is provided, verify it
      if (hmac) {
        const isValidHMAC = CryptoService.verifyPrescriptionHMAC(prescriptionId, hmac);
        if (!isValidHMAC) {
          await AnomalyDetector.recordAlert({
            severity: 'HIGH',
            type: 'TAMPER_DETECTED',
            details: `QR Code HMAC signature verification failed for prescription ID: ${prescriptionId}. Potential forged QR presentation.`,
            prescriptionId,
            ipAddress: String(ip),
            userId: req.user ? req.user.id : null
          });

          return res.status(401).json({
            error: 'QR Code Tamper Detected: Invalid cryptographic HMAC signature.'
          });
        }
      }

      // Forward to getPrescriptionById logic
      req.params = { id: prescriptionId };
      return PrescriptionController.getPrescriptionById(req, res);
    } catch (error) {
      console.error('Verify QR error:', error);
      return res.status(500).json({ error: 'Failed to verify QR code: ' + error.message });
    }
  }

  /**
   * List prescriptions tailored to user's role
   */
  static async listPrescriptions(req, res) {
    try {
      const user = req.user;
      let where = {};

      if (user.role === 'PATIENT') {
        where = {
          OR: [
            { patientId: user.id },
            { patientEmail: user.email.toLowerCase().trim() }
          ]
        };
      } else if (user.role === 'DOCTOR') {
        where = { doctorId: user.id };
      } else if (user.role === 'PHARMACIST') {
        // Strict Privacy Isolation: Pharmacists can ONLY view prescriptions they personally dispensed.
        // They CANNOT browse or access other patients' pending prescriptions without direct patient presentation (ID or QR code).
        where = {
          dispensedByPharmacist: { contains: user.name }
        };
      }
      // Auditors can view all records to verify audit trails and compliance

      const list = await prisma.prescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientName: true,
          patientEmail: true,
          doctorName: true,
          clinicName: true,
          dateIssued: true,
          status: true,
          dataHash: true,
          dispensedByPharmacist: true,
          dispensedAt: true,
          createdAt: true
        }
      });

      return res.json({ prescriptions: list });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Patient claims an unassigned prescription using their unique Prescription ID
   */
  static async claimPrescription(req, res) {
    try {
      const { prescriptionId } = req.body;
      const user = req.user;

      if (user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Only registered patients can link prescriptions to their vault.' });
      }

      if (!prescriptionId) {
        return res.status(400).json({ error: 'Prescription ID is required.' });
      }

      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId.trim() }
      });

      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found with the provided ID.' });
      }

      // Check if already claimed by another registered patient
      const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' }, select: { id: true } });
      const doctorIds = doctors.map(d => d.id);
      const isUnassigned = doctorIds.includes(prescription.patientId);

      if (prescription.patientId !== user.id && !isUnassigned) {
        return res.status(403).json({ error: 'This prescription is already bound to another registered patient vault.' });
      }

      // Link to this patient
      const updated = await prisma.prescription.update({
        where: { id: prescription.id },
        data: { patientId: user.id }
      });

      return res.json({
        message: 'Prescription successfully linked to your personal vault!',
        prescriptionId: updated.id,
        patientName: updated.patientName
      });
    } catch (err) {
      console.error('Claim prescription error:', err);
      return res.status(500).json({ error: 'Failed to link prescription: ' + err.message });
    }
  }
}

module.exports = PrescriptionController;
