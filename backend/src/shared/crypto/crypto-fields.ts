import { getEncryption } from './encryption.service';
import type { CryptoConfig } from './types';
import { logger } from '@/shared/logger/logger';

const encryption = getEncryption();

export const encryptFields = <T extends Record<string, unknown>>(
  data: T,
  config: CryptoConfig
): T => {
  const result = { ...data };

  for (const field of config.fields) {
    const value = result[field as keyof T];

    if (typeof value === 'string' && value.length > 0) {
      try {
        const encrypted = encryption.encrypt(value);
        result[field as keyof T] = encrypted as T[keyof T];
      } catch (error) {
        logger.error({ field: String(field), error }, 'Failed to encrypt field');
        throw new Error(`Encryption failed for field: ${String(field)}`);
      }
    }
  }

  return result;
};

export const decryptFields = <T extends Record<string, unknown>>(
  data: T,
  config: CryptoConfig
): T => {
  const result = { ...data };

  for (const field of config.fields) {
    const value = result[field as keyof T];

    if (typeof value === 'string' && value.length > 0) {
      try {
        const decrypted = encryption.decrypt(value);
        result[field as keyof T] = decrypted as T[keyof T];
      } catch (error) {
        logger.warn({ field: String(field), error }, 'Decryption failed - possibly unencrypted data');
      }
    }
  }

  return result;
};

export const encryptFieldsArray = <T extends Record<string, unknown>>(
  items: T[],
  config: CryptoConfig
): T[] => items.map(item => encryptFields(item, config));

export const decryptFieldsArray = <T extends Record<string, unknown>>(
  items: T[],
  config: CryptoConfig
): T[] => items.map(item => decryptFields(item, config));

export const createCryptoConfig = (fields: ReadonlyArray<string>): CryptoConfig => 
  Object.freeze({ fields });