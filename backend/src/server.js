require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const securityRoutes = require('./routes/security.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Zero-Knowledge Prescription Vault API',
    cryptography: 'AES-256-GCM + SHA-256 + RSA-2048',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/security', securityRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔒 Zero-Knowledge Medical Prescription Vault Backend`);
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🛡️  RBAC & Anomaly Detection Active`);
  console.log(`🔑 Master AES-256-GCM Encryption Initialized`);
  console.log(`====================================================`);
});
