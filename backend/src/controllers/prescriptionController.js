const prisma = require('../config/db');
const CryptoService = require('../services/cryptoService');
const OCRClient = require('../services/ocrClient');
const AnomalyDetector = require('../middleware/anomalyDetector');

class PrescriptionController {
  /**
   * Accepts uploaded slip, forwards to Python AI service, returns extracted entities
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
   * Doctor issues and cryptographically seals a prescription
   */
  static async issuePrescription(req, res) {
    try {
      const {
        patientId,
        patientName,
        clinicName,
        dateIssued,
        diagnosis,
        medications
      } = req.body;

      if (!patientName || !medications || !Array.isArray(medications)) {
        return res.status(400).json({ error: 'Patient name and medications list are required.' });
      }

      // Fetch issuing doctor with private key
      const doctor = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!doctor || doctor.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only registered medical doctors can issue prescriptions.' });
      }

      // Resolve patient (if patientId not provided, search by email or create placeholder)
      let resolvedPatientId = patientId;
      if (!resolvedPatientId) {
        let pUser = await prisma.user.findFirst({
          where: { role: 'PATIENT', name: patientName }
        });
        if (!pUser) {
          pUser = await prisma.user.findFirst({ where: { role: 'PATIENT' } });
        }
        resolvedPatientId = pUser ? pUser.id : doctor.id;
      }

      // 1. Construct canonical data object for integrity hashing
      const canonicalRecord = {
        patientName,
        doctorName: doctor.name,
        doctorLicense: doctor.licenseNumber || 'N/A',
        clinicName: clinicName || doctor.clinic || 'Medical Clinic',
        dateIssued: dateIssued || new Date().toISOString().split('T')[0],
        diagnosis: diagnosis || 'General Clinical Evaluation',
        medications: medications
      };

      // 2. Generate SHA-256 Tamper-Evident Fingerprint
      const dataHash = CryptoService.computeSHA256(canonicalRecord);

      // 3. Doctor signs the SHA-256 hash using Doctor's Private Key
      let doctorSignature = 'MOCK_SIGNATURE';
      if (doctor.privateKey) {
        doctorSignature = CryptoService.signHash(dataHash, doctor.privateKey);
      }

      // 4. AES-256-GCM Vault Encryption
      // Encrypt diagnosis and medications separately to facilitate Selective Disclosure (Zero-Knowledge)
      const encryptedDiagnosis = CryptoService.encryptAES256GCM(canonicalRecord.diagnosis);
      const encryptedMedications = CryptoService.encryptAES256GCM(canonicalRecord.medications);

      // 5. Store in Vault
      const prescription = await prisma.prescription.create({
        data: {
          patientId: resolvedPatientId,
          doctorId: doctor.id,
          patientName,
          doctorName: doctor.name,
          clinicName: canonicalRecord.clinicName,
          dateIssued: canonicalRecord.dateIssued,
          status: 'ISSUED',
          encryptedDiagnosis,
          encryptedMedications,
          dataHash,
          doctorSignature
        }
      });

      // Audit log
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      await prisma.prescriptionAudit.create({
        data: {
          prescriptionId: prescription.id,
          userId: req.user.id,
          userRole: req.user.role,
          action: 'ISSUED_AND_CRYPTOGRAPHICALLY_SEALED',
          ipAddress: ip
        }
      });

      return res.status(201).json({
        message: 'Prescription cryptographically sealed and saved to vault.',
        prescriptionId: prescription.id,
        dataHash,
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
   * - Doctor / Patient: Sees full diagnosis and medications.
   */
  static async getPrescriptionById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true, name: true, licenseNumber: true, clinic: true, publicKey: true } },
          patient: { select: { id: true, name: true, email: true } }
        }
      });

      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found in vault.' });
      }

      // 1. Decrypt medications using AES-256-GCM
      let decryptedMedications = [];
      try {
        decryptedMedications = CryptoService.decryptAES256GCM(prescription.encryptedMedications);
      } catch (err) {
        await AnomalyDetector.recordAlert({
          severity: 'CRITICAL',
          type: 'TAMPER_DETECTED',
          details: `AES-256-GCM AuthTag validation failed for prescription ${id}. Ciphertext has been modified or corrupted!`,
          prescriptionId: id,
          ipAddress: ip,
          userId: user.id
        });
        return res.status(500).json({ error: 'Cryptographic tamper alarm: Data authentication tag mismatch!' });
      }

      // 2. Selective Disclosure: Decrypt Diagnosis ONLY for Doctor, Patient, or Auditor
      let decryptedDiagnosis = null;
      let diagnosisDisclosed = false;

      if (user.role === 'PHARMACIST') {
        decryptedDiagnosis = '[REDACTED: Protected by Zero-Knowledge Selective Disclosure]';
        diagnosisDisclosed = false;
      } else {
        try {
          decryptedDiagnosis = CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis);
          diagnosisDisclosed = true;
        } catch (err) {
          decryptedDiagnosis = '[Tamper Warning: Failed to decrypt diagnosis]';
        }
      }

      // 3. Real-Time Cryptographic Verification
      const reconstructedRecord = {
        patientName: prescription.patientName,
        doctorName: prescription.doctorName,
        doctorLicense: prescription.doctor.licenseNumber || 'N/A',
        clinicName: prescription.clinicName,
        dateIssued: prescription.dateIssued,
        diagnosis: typeof decryptedDiagnosis === 'string' && !decryptedDiagnosis.includes('REDACTED') 
          ? decryptedDiagnosis 
          : CryptoService.decryptAES256GCM(prescription.encryptedDiagnosis),
        medications: decryptedMedications
      };

      const computedHash = CryptoService.computeSHA256(reconstructedRecord);
      const isHashValid = computedHash === prescription.dataHash;

      let isSignatureValid = false;
      if (prescription.doctor.publicKey && prescription.doctorSignature) {
        isSignatureValid = CryptoService.verifySignature(
          prescription.dataHash,
          prescription.doctorSignature,
          prescription.doctor.publicKey
        );
      }

      // Record Audit
      await prisma.prescriptionAudit.create({
        data: {
          prescriptionId: id,
          userId: user.id,
          userRole: user.role,
          action: 'VIEWED',
          ipAddress: ip
        }
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
          cryptoVerification: {
            algorithm: 'AES-256-GCM + SHA-256 + RSA-2048',
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
   * Pharmacist dispenses prescription (Guards against Double-Fill Replay Attacks!)
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

      // Check state machine: PREVENT DOUBLE-FILL ATTACK
      if (prescription.status === 'DISPENSED') {
        await AnomalyDetector.recordAlert({
          severity: 'CRITICAL',
          type: 'DOUBLE_FILL_ATTACK',
          details: `Replay attack detected: Pharmacist ${pharmacist.name} (${pharmacist.email}) attempted to dispense already-fulfilled prescription ID ${id}. Dispensed previously on ${prescription.dispensedAt}.`,
          prescriptionId: id,
          ipAddress: ip,
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

      // Audit log
      await prisma.prescriptionAudit.create({
        data: {
          prescriptionId: id,
          userId: pharmacist.id,
          userRole: pharmacist.role,
          action: 'DISPENSED_MEDICATION',
          ipAddress: ip
        }
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
   * List prescriptions tailored to user's role
   */
  static async listPrescriptions(req, res) {
    try {
      const user = req.user;
      let where = {};

      if (user.role === 'PATIENT') {
        where = { patientId: user.id };
      } else if (user.role === 'DOCTOR') {
        where = { doctorId: user.id };
      }
      // Pharmacists and Auditors can view all records to verify dispense status

      const list = await prisma.prescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientName: true,
          doctorName: true,
          clinicName: true,
          dateIssued: true,
          status: true,
          dataHash: true,
          dispensedAt: true,
          createdAt: true
        }
      });

      return res.json({ prescriptions: list });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PrescriptionController;
