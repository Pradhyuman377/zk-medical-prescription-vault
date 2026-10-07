const crypto = require('crypto');

// Load master key from env or fallback to a deterministic 32-byte buffer
const rawMasterKey = process.env.MASTER_VAULT_KEY || 'a4f9b231c58e72d1490218f76d4e1bc2a4f9b231c58e72d1490218f76d4e1bc2';
const MASTER_KEY = Buffer.from(rawMasterKey, 'hex');

class CryptoService {
  /**
   * Encrypts plaintext string or JSON object using AES-256-GCM.
   * GCM (Galois/Counter Mode) provides both confidentiality and built-in authenticity tags.
   */
  static encryptAES256GCM(data) {
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // 12-byte IV is the NIST-recommended size for AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
    
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
  static decryptAES256GCM(encryptedPayloadString) {
    try {
      const payload = typeof encryptedPayloadString === 'string' 
        ? JSON.parse(encryptedPayloadString) 
        : encryptedPayloadString;

      const iv = Buffer.from(payload.iv, 'hex');
      const authTag = Buffer.from(payload.authTag, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
      
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
   * Computes deterministic SHA-256 hash representing tamper-evident data fingerprint.
   */
  static computeSHA256(data) {
    const canonicalString = typeof data === 'object' 
      ? JSON.stringify(data, Object.keys(data).sort()) 
      : String(data);
      
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }

  /**
   * Generates RSA keypair for doctor signing/verification
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
   * Doctor signs the SHA-256 prescription hash with their private key
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
}

module.exports = CryptoService;
