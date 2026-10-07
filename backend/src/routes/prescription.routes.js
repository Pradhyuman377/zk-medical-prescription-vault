const express = require('express');
const router = express.Router();
const multer = require('multer');
const PrescriptionController = require('../controllers/prescriptionController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');
const AnomalyDetector = require('../middleware/anomalyDetector');

// In-memory Multer storage for buffer-based forwarding to Python AI service
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Anomaly monitoring active on prescription routes
router.use(AnomalyDetector.monitorPrescriptionRequests());

// 1. Upload & AI OCR Extraction (Patient & Doctor can upload)
router.post(
  '/upload-ocr',
  authenticate,
  authorizeRoles('DOCTOR', 'PATIENT'),
  upload.single('prescriptionImage'),
  PrescriptionController.uploadAndExtractOCR
);

// 2. Issue and Cryptographically Seal Prescription (Strictly DOCTOR role)
router.post(
  '/issue',
  authenticate,
  authorizeRoles('DOCTOR'),
  PrescriptionController.issuePrescription
);

// 3. List User Prescriptions
router.get(
  '/',
  authenticate,
  PrescriptionController.listPrescriptions
);

// 4. View Prescription with Selective Disclosure (Any authenticated role with proper filtering)
router.get(
  '/:id',
  authenticate,
  PrescriptionController.getPrescriptionById
);

// 5. Dispense Prescription (Strictly PHARMACIST role)
router.post(
  '/:id/dispense',
  authenticate,
  authorizeRoles('PHARMACIST'),
  PrescriptionController.dispensePrescription
);

module.exports = router;
