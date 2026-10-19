const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const CryptoService = require('../services/cryptoService');
const AnomalyDetector = require('../middleware/anomalyDetector');

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

      // TASK 12: Generate ECDH keypair (secp256k1) for pairwise key agreement across ALL roles
      const ecdhPair = CryptoService.generateECDHKeyPair();
      // TASK 5: Encrypt private key at rest using Master Vault Key
      // Production: Use HSM/KMS for private key storage
      const encryptedEcdhPrivateKey = CryptoService.encryptPrivateKey(ecdhPair.privateKey);

      // If user is a DOCTOR, generate an asymmetric RSA keypair for digital signing
      let publicKey = null;
      let encryptedRsaPrivateKey = null;
      if (role === 'DOCTOR') {
        const keyPair = CryptoService.generateDoctorKeyPair();
        publicKey = keyPair.publicKey;
        // TASK 5: Encrypt private key at rest
        // Production: Use HSM/KMS for private key storage
        encryptedRsaPrivateKey = CryptoService.encryptPrivateKey(keyPair.privateKey);
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
          privateKey: encryptedRsaPrivateKey,
          ecdhPublicKey: ecdhPair.publicKey,
          ecdhPrivateKey: encryptedEcdhPrivateKey,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'User registered successfully with encrypted keys at rest.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          licenseNumber: user.licenseNumber,
          clinic: user.clinic,
          hasKeyPair: !!publicKey,
          hasEcdhKey: !!ecdhPair.publicKey
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
  }

  /**
   * TASK 6: Failed login tracking + account lockout + brute force alerts
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Check if user is currently locked out
      const now = new Date();
      if (user.lockedUntil && new Date(user.lockedUntil) > now) {
        const remainingMs = new Date(user.lockedUntil).getTime() - now.getTime();
        const remainingMins = Math.ceil(remainingMs / 60000);
        return res.status(423).json({
          error: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMins} minute(s).`,
          lockedUntil: user.lockedUntil
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        let updateData = { failedLoginAttempts: attempts };

        if (attempts >= 5) {
          const lockTime = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
          updateData.lockedUntil = lockTime;

          await AnomalyDetector.recordAlert({
            severity: 'HIGH',
            type: 'BRUTE_FORCE_DETECTED',
            details: `Account lockout triggered: 5 consecutive failed login attempts on account ${email} from IP: ${ip}. Account locked for 15 minutes.`,
            ipAddress: String(ip),
            userId: user.id
          });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });

        if (attempts >= 5) {
          return res.status(423).json({
            error: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
            lockedUntil: updateData.lockedUntil
          });
        }

        const remaining = 5 - attempts;
        return res.status(401).json({
          error: `Invalid email or password. ${remaining} attempt(s) remaining before account lockout.`
        });
      }

      // Successful login: reset lockout counters
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

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
          hasKeyPair: !!user.publicKey,
          hasEcdhKey: !!user.ecdhPublicKey
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
   * Helper to seed demo accounts for each role with encrypted keys at rest
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
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);

        // ECDH keypair
        const ecdhPair = CryptoService.generateECDHKeyPair();
        const encryptedEcdhPriv = CryptoService.encryptPrivateKey(ecdhPair.privateKey);

        let pub = null, encryptedPriv = null;
        if (u.role === 'DOCTOR') {
          const pair = CryptoService.generateDoctorKeyPair();
          pub = pair.publicKey;
          encryptedPriv = CryptoService.encryptPrivateKey(pair.privateKey);
        }

        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
          await prisma.user.create({
            data: {
              email: u.email,
              password: hashedPassword,
              name: u.name,
              role: u.role,
              licenseNumber: u.licenseNumber,
              clinic: u.clinic,
              publicKey: pub,
              privateKey: encryptedPriv,
              ecdhPublicKey: ecdhPair.publicKey,
              ecdhPrivateKey: encryptedEcdhPriv,
              failedLoginAttempts: 0,
              lockedUntil: null
            }
          });
        } else {
          // Update missing keys or reset lockout
          await prisma.user.update({
            where: { email: u.email },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              ...(exists.ecdhPublicKey ? {} : { ecdhPublicKey: ecdhPair.publicKey, ecdhPrivateKey: encryptedEcdhPriv }),
              ...(u.role === 'DOCTOR' && !exists.publicKey ? { publicKey: pub, privateKey: encryptedPriv } : {})
            }
          });
        }
      }

      return res.json({ message: 'Demo accounts seeded successfully with encrypted keys and lockout support. You can login with password "password123"' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
