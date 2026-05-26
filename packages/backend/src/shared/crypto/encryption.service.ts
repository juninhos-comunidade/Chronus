import crypto from 'crypto';
import { env } from '@/config/env';
import type { Encrypted, Hashed } from './types';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

interface EncryptedPayload {
  salt: Buffer;
  iv: Buffer;
  tag: Buffer;
  data: Buffer;
}

export class EncryptionService {
  private readonly masterKey: Buffer;

  constructor(masterKeyHex: string) {
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
    
    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error(
        `Master key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars). Got ${this.masterKey.length} bytes.`
      );
    }
  }

  encrypt(plaintext: string): Encrypted {
    if (!plaintext || plaintext.length === 0) {
      return plaintext;
    }

    try {
      const salt = crypto.randomBytes(SALT_LENGTH);
      const key = crypto.pbkdf2Sync(this.masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      const payload = Buffer.concat([salt, iv, tag, encrypted]);
      
      return payload.toString('base64');
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  decrypt(ciphertext: Encrypted): string {
    if (!ciphertext || ciphertext.length === 0) {
      return ciphertext;
    }

    try {
      const payload = this.parseEncryptedPayload(ciphertext);
      const key = crypto.pbkdf2Sync(this.masterKey, payload.salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, payload.iv);
      decipher.setAuthTag(payload.tag);
      const decrypted = Buffer.concat([decipher.update(payload.data), decipher.final()]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  hash(value: string): Hashed {
    const normalized = value.toLowerCase().trim();
    return crypto.createHmac('sha256', this.masterKey).update(normalized).digest('hex');
  }

  verifyHash(value: string, hashedValue: Hashed): boolean {
    const computedHash = this.hash(value);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hashedValue));
  }

  private parseEncryptedPayload(ciphertext: string): EncryptedPayload {
    const buffer = Buffer.from(ciphertext, 'base64');
    
    if (buffer.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
      throw new Error('Invalid ciphertext: too short');
    }
    
    let offset = 0;
    const salt = buffer.subarray(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;
    const iv = buffer.subarray(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;
    const tag = buffer.subarray(offset, offset + TAG_LENGTH);
    offset += TAG_LENGTH;
    const data = buffer.subarray(offset);
    
    return { salt, iv, tag, data };
  }

  static generateMasterKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }
}

export const getEncryption = (() => {
  let instance: EncryptionService | null = null;
  
  return (): EncryptionService => {
    if (!instance) {
      instance = new EncryptionService(env.ENCRYPTION_KEY);
    }
    return instance;
  };
})();