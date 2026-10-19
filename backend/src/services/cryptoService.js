const crypto = require('crypto');
const QRCode = require('qrcode');

// Load master key from env or fallback to a deterministic 32-byte buffer
const rawMasterKey = process.env.MASTER_VAULT_KEY || 'a4f9b231c58e72d1490218f76d4e1bc2a4f9b231c58e72d1490218f76d4e1bc2';
const MASTER_KEY = Buffer.from(rawMasterKey, 'hex');

class CryptoService {
  /**
   * Encrypts plaintext string or JSON object using AES-256-GCM.
   * GCM (Galois/Counter Mode) provides both confidentiality and built-in authenticity tags.
   */
  static encryptAES256GCM(data, customKey = MASTER_KEY) {
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const key = Buffer.isBuffer(customKey) ? customKey : Buffer.from(customKey, 'hex');
    
    // 12-byte IV is the NIST-recommended size for AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return JSON.stringify({
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag,
      algorithm: 'AES-256-GCM'
    });
  }

  /**
   * Decrypts AES-256-GCM payload. Validates authTag to prevent ciphertext tampering.
   */
  static decryptAES256GCM(encryptedPayloadString, customKey = MASTER_KEY) {
    try {
      const payload = typeof encryptedPayloadString === 'string' 
        ? JSON.parse(encryptedPayloadString) 
        : encryptedPayloadString;

      const key = Buffer.isBuffer(customKey) ? customKey : Buffer.from(customKey, 'hex');
      const iv = Buffer.from(payload.iv, 'hex');
      const authTag = Buffer.from(payload.authTag, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (err) {
      throw new Error(`Decryption failed or ciphertext was tampered with: ${err.message}`);
    }
  }

  /**
   * Encrypts Doctor RSA or ECDH private key at rest using the Master Key.
   * // Production: Use Hardware Security Module (HSM) or Cloud KMS (AWS KMS / GCP Cloud KMS) for private key storage.
   */
  static encryptPrivateKey(privateKeyPem) {
    if (!privateKeyPem) return null;
    return this.encryptAES256GCM(privateKeyPem, MASTER_KEY);
  }

  /**
   * Decrypts private key from vault storage.
   * Supports backward compatibility if raw PEM was stored in existing records.
   * // Production: Use Hardware Security Module (HSM) or Cloud KMS for private key storage.
   */
  static decryptPrivateKey(storedValue) {
    if (!storedValue) return null;
    // If it's already a raw PEM or hex string, return directly
    if (typeof storedValue === 'string' && (storedValue.includes('BEGIN') || storedValue.length < 100 && !storedValue.includes('{'))) {
      return storedValue;
    }
    try {
      return this.decryptAES256GCM(storedValue, MASTER_KEY);
    } catch {
      return storedValue;
    }
  }

  /**
   * Computes deterministic SHA-256 hash representing tamper-evident data fingerprint.
   */
  static computeSHA256(data) {
    const canonicalString = typeof data === 'object' 
      ? JSON.stringify(data, Object.keys(data).sort()) 
      : String(data);
      
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }

  /**
   * Generates RSA-2048 keypair for doctor signing/verification
   */
  static generateDoctorKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  /**
   * Doctor signs the SHA-256 prescription hash with their RSA private key
   */
  static signHash(dataHash, privateKeyPem) {
    const sign = crypto.createSign('SHA256');
    sign.update(dataHash);
    sign.end();
    return sign.sign(privateKeyPem, 'hex');
  }

  /**
   * Pharmacist verifies doctor's signature using doctor's public key
   */
  static verifySignature(dataHash, signatureHex, publicKeyPem) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(dataHash);
      verify.end();
      return verify.verify(publicKeyPem, signatureHex, 'hex');
    } catch (err) {
      return false;
    }
  }

  /**
   * TASK 12: Elliptic Curve Diffie-Hellman (ECDH) Key Exchange
   * Generates secp256k1 keypair for pairwise secret agreement between Doctor & Patient.
   */
  static generateECDHKeyPair() {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.generateKeys();
    return {
      publicKey: ecdh.getPublicKey('hex'),
      privateKey: ecdh.getPrivateKey('hex')
    };
  }

  /**
   * Derives a pairwise 256-bit symmetric key using ECDH shared secret + SHA-256 KDF.
   * Formula: K_shared = SHA-256(ECDH_computeSecret(myPrivKey, theirPubKey))
   */
  static deriveSharedSecret(myPrivateKeyHex, theirPublicKeyHex) {
    try {
      const ecdh = crypto.createECDH('secp256k1');
      ecdh.setPrivateKey(myPrivateKeyHex, 'hex');
      const sharedSecret = ecdh.computeSecret(theirPublicKeyHex, 'hex');
      // KDF: Hash raw shared secret with SHA-256 to produce uniform 32-byte AES key
      return crypto.createHash('sha256').update(sharedSecret).digest();
    } catch (err) {
      console.error('ECDH derivation error, falling back to Master Key:', err.message);
      return MASTER_KEY;
    }
  }

  /**
   * TASK 11: HMAC-SHA256 for QR Code tamper protection
   */
  static generatePrescriptionHMAC(prescriptionId) {
    return crypto.createHmac('sha256', MASTER_KEY).update(prescriptionId).digest('hex');
  }

  static verifyPrescriptionHMAC(prescriptionId, hmacHex) {
    try {
      const expected = this.generatePrescriptionHMAC(prescriptionId);
      const expectedBuf = Buffer.from(expected, 'hex');
      const actualBuf = Buffer.from(hmacHex, 'hex');
      if (expectedBuf.length !== actualBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }

  /**
   * Generates base64 QR code image encoding signed prescription token
   */
  static async generateQRCodeDataURL(prescriptionId) {
    const hmac = this.generatePrescriptionHMAC(prescriptionId);
    const payload = JSON.stringify({ prescriptionId, hmac, protocol: 'ZK-RX-QR-v1' });
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#020617', // Slate-950
        light: '#ffffff'
      }
    });
  }
}

module.exports = CryptoService;
