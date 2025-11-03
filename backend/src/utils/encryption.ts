import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

class EncryptionService {
  private key: Buffer;

  constructor() {
    if (!config.encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY is not set in environment variables. Run: npm run generate-key'
      );
    }

    try {
      this.key = Buffer.from(config.encryptionKey, 'base64');
      
      if (this.key.length !== KEY_LENGTH) {
        throw new Error(
          `ENCRYPTION_KEY must be exactly ${KEY_LENGTH} bytes (256 bits). ` +
          `Current key is ${this.key.length} bytes. Run: npm run generate-key`
        );
      }
    } catch (error: any) {
      throw new Error(
        `Invalid ENCRYPTION_KEY format: ${error.message}. Run: npm run generate-key`
      );
    }
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * @param plaintext - The text to encrypt
   * @returns Format: iv:authTag:ciphertext (all base64)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty string');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Package: iv:authTag:ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   * @param payload - Format: iv:authTag:ciphertext (all base64)
   * @returns Decrypted plaintext
   */
  decrypt(payload: string): string {
    if (!payload) {
      throw new Error('Cannot decrypt empty string');
    }

    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted payload format. Expected: iv:authTag:ciphertext'
      );
    }

    const [ivB64, authTagB64, ciphertext] = parts;

    try {
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');

      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error(
          'Decryption failed: Invalid key or corrupted data. The encryption key may have changed.'
        );
      }
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Validate that a payload can be decrypted (without returning the value)
   * @param payload - The encrypted payload to validate
   * @returns true if valid, false otherwise
   */
  validate(payload: string): boolean {
    try {
      this.decrypt(payload);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Export convenience functions
export const encrypt = (plaintext: string) => encryptionService.encrypt(plaintext);
export const decrypt = (payload: string) => encryptionService.decrypt(payload);
export const validateEncrypted = (payload: string) => encryptionService.validate(payload);



