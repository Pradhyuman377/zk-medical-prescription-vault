require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const inputSanitizer = require('./middleware/inputSanitizer');

const authRoutes = require('./routes/auth.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const securityRoutes = require('./routes/security.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Warnings: Environment Variables
if (!process.env.MASTER_VAULT_KEY) {
  console.warn('⚠️ [SECURITY WARNING] MASTER_VAULT_KEY is not defined in .env! Using insecure fallback key. Set a secure 32-byte hex key in production.');
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ [SECURITY WARNING] JWT_SECRET is not defined in .env! Using insecure fallback secret. Define a high-entropy secret in production.');
}

// Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allow local dev Vite inline scripts/styles
  crossOriginEmbedderPolicy: false
}));

// Hardened CORS: Restrict exclusively to trusted frontend origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares & Input Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(inputSanitizer);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Zero-Knowledge Prescription Vault API',
    cryptography: 'AES-256-GCM + SHA-256 + RSA-2048 + ECDH-secp256k1',
    securityHeaders: 'Helmet Active',
    corsPolicy: 'Restricted (localhost:5173)',
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
  console.log(`🛡️  Helmet Security Headers & Input Sanitization Active`);
  console.log(`🌐 Hardened CORS: Restricted to http://localhost:5173`);
  console.log(`🔑 Master AES-256-GCM & ECDH Protocols Initialized`);
  console.log(`====================================================`);
});

