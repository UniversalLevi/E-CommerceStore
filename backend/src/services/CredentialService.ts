import crypto from 'crypto';
import { ConnectedStore } from '../models/ConnectedStore';
import { createError } from '../middleware/errorHandler';

export class CredentialService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits

  private static getKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY;
    
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY not set in environment');
    }

    const key = Buffer.from(keyHex, 'hex');
    
    if (key.length !== this.KEY_LENGTH) {
      throw new Error(`ENCRYPTION_KEY must be ${this.KEY_LENGTH} bytes (${this.KEY_LENGTH * 2} hex characters)`);
    }

    return key;
  }

  /**
   * Encrypt credentials before storing in database
   * Format: version:iv:authTag:encrypted
   * @param plaintext - The token or credential to encrypt
   * @param version - Encryption version (for future key rotation)
   */
  static encrypt(plaintext: string, version = 1): string {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(16); // 128-bit IV for GCM
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Return versioned format for future key rotation
      return `${version}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error: any) {
      console.error('Encryption error:', error.message);
      throw new Error('Failed to encrypt credentials');
    }
  }

  /**
   * Decrypt credentials on-demand (never cached)
   * @param ciphertext - The encrypted credentials in format version:iv:authTag:encrypted
   */
  static decrypt(ciphertext: string): string {
    try {
      const parts = ciphertext.split(':');
      
      if (parts.length !== 4) {
        throw new Error('Invalid ciphertext format');
      }

      const [version, ivHex, authTagHex, encrypted] = parts;
      
      const key = this.getKey();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      console.error('Decryption error:', error.message);
      throw new Error('Failed to decrypt credentials');
    }
  }

  /**
   * Get store credentials with access validation
   * Decrypts on-demand, no caching
   * @param storeId - The connected store ID
   * @param userId - The user ID for access validation
   */
  static async getStoreCredentials(storeId: string, userId: string) {
    try {
      const store = await ConnectedStore.findOne({ 
        _id: storeId, 
        userId 
      });
      
      if (!store) {
        throw createError('Store not found or access denied', 403);
      }

      // Check if store is active
      if (store.status === 'revoked') {
        throw createError('Store connection has been revoked', 403);
      }

      if (store.status === 'expired') {
        throw createError('Store credentials have expired. Please reconnect.', 401);
      }

      // Decrypt on demand (not cached)
      const decryptedToken = this.decrypt(store.encryptedCredentials);
      
      return {
        storeId: String(store._id),
        storeDomain: store.storeDomain,
        accessToken: decryptedToken,
        status: store.status,
        platform: store.platform,
        webhookSecret: store.webhookSecret,
        hmacSecret: store.hmacSecret,
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      console.error('Error getting store credentials:', error);
      throw createError('Failed to retrieve store credentials', 500);
    }
  }

  /**
   * Validate that credentials can be decrypted (for testing/migration)
   * @param ciphertext - The encrypted credentials to validate
   */
  static validate(ciphertext: string): boolean {
    try {
      this.decrypt(ciphertext);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a secure encryption key (for setup/documentation)
   * Returns a 32-byte key as hex string
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }
}

