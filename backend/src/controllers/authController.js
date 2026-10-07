const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const CryptoService = require('../services/cryptoService');

const JWT_SECRET = process.env.JWT_SECRET || 'medical_vault_jwt_super_secret_key_2026_xyz';

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, name, role, licenseNumber, clinic } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, password, name, and role are required.' });
      }

      const validRoles = ['PATIENT', 'DOCTOR', 'PHARMACIST', 'AUDITOR'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // If user is a DOCTOR, generate an asymmetric RSA keypair for tamper-proof digital signing
      let publicKey = null;
      let privateKey = null;
      if (role === 'DOCTOR') {
        const keyPair = CryptoService.generateDoctorKeyPair();
        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          licenseNumber: licenseNumber || null,
          clinic: clinic || null,
          publicKey,
          privateKey
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          licenseNumber: user.licenseNumber,
          clinic: user.clinic,
          hasKeyPair: !!publicKey
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          licenseNumber: user.licenseNumber,
          clinic: user.clinic,
          hasKeyPair: !!user.publicKey
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed: ' + error.message });
    }
  }

  static async getMe(req, res) {
    return res.json({ user: req.user });
  }

  /**
   * Helper to seed demo accounts for each role
   */
  static async seedDemoAccounts(req, res) {
    try {
      const demoUsers = [
        { email: 'doctor@hospital.org', password: 'password123', name: 'Dr. Sarah Jenkins, MD', role: 'DOCTOR', licenseNumber: 'MED-90210-USA', clinic: 'Metropolitan General Hospital' },
        { email: 'patient@vault.org', password: 'password123', name: 'Aarav Patel', role: 'PATIENT', licenseNumber: null, clinic: null },
        { email: 'pharmacist@rxcare.org', password: 'password123', name: 'Liam Vance, R.Ph', role: 'PHARMACIST', licenseNumber: 'PHARM-88210', clinic: 'CVS Care Pharmacy #412' },
        { email: 'auditor@cybersecurity.org', password: 'password123', name: 'Elena Rostova, CISO', role: 'AUDITOR', licenseNumber: 'SEC-AUD-007', clinic: 'Department of Health & Security' }
      ];

      for (const u of demoUsers) {
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(u.password, salt);
          let pub = null, priv = null;
          if (u.role === 'DOCTOR') {
            const pair = CryptoService.generateDoctorKeyPair();
            pub = pair.publicKey;
            priv = pair.privateKey;
          }
          await prisma.user.create({
            data: {
              email: u.email,
              password: hashedPassword,
              name: u.name,
              role: u.role,
              licenseNumber: u.licenseNumber,
              clinic: u.clinic,
              publicKey: pub,
              privateKey: priv
            }
          });
        }
      }

      return res.json({ message: 'Demo accounts seeded successfully. You can login with password "password123"' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
