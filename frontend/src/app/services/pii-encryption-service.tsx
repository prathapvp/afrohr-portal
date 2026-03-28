/**
 * PII Encryption Service
 *
 * Provides encryption/decryption for Personally Identifiable Information (PII)
 * before transmission and storage.
 *
 * IMPORTANT: This is CLIENT-SIDE encryption for in-transit protection.
 * For production, backend should implement:
 * - Field-level encryption at database (AES-256-GCM)
 * - Key management system (AWS KMS, HashiCorp Vault, Azure Key Vault)
 * - Transparent Data Encryption (TDE) for entire database
 */

// ==================== TYPES ====================

export interface EncryptedField {
  value: string;
  iv: string;
  encrypted: true;
}

export interface PIIFields {
  dateOfBirth?: string | Date;
  ssn?: string;
  nationalId?: string;

  phone?: string;
  alternateContact?: string;
  address?: string;
  pincode?: string;

  email?: string;
  alternateEmail?: string;
  religion?: string;
  maritalStatus?: string;
  visaStatus?: string;
}

// ==================== CONFIGURATION ====================

const SENSITIVE_FIELDS = {
  CRITICAL: ['dateOfBirth', 'ssn', 'nationalId'],
  HIGH: ['phone', 'alternateContact', 'address', 'fullAddress', 'pincode'],
  MEDIUM: ['alternateEmail', 'religion', 'visaStatus'],
};

const isBackendEncryptionEnabled = (): boolean => {
  return false; // TODO: Check backend encryption support
};

// ==================== WEB CRYPTO API ENCRYPTION ====================

const deriveKey = async (password: string, salt: ArrayBuffer): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptPII = async (plaintext: string, secret?: string): Promise<EncryptedField> => {
  try {
    const encryptionSecret = secret || sessionStorage.getItem('pii-encryption-key') || 'default-secret-key-change-me';
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(encryptionSecret, saltBytes.buffer);

    const encoder = new TextEncoder();
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    );

    const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...Array.from(iv)));
    const saltBase64 = btoa(String.fromCharCode(...Array.from(saltBytes)));

    return {
      value: `${saltBase64}:${encryptedBase64}`,
      iv: ivBase64,
      encrypted: true,
    };
  } catch (error) {
    console.error('PII encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
};

export const decryptPII = async (encryptedData: EncryptedField, secret?: string): Promise<string> => {
  try {
    const encryptionSecret = secret || sessionStorage.getItem('pii-encryption-key') || 'default-secret-key-change-me';

    const [saltBase64, encryptedBase64] = encryptedData.value.split(':');
    const ivBase64 = encryptedData.iv;

    const salt = new Uint8Array(atob(saltBase64).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const encryptedBuffer = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));

    const key = await deriveKey(encryptionSecret, salt.buffer);

    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedBuffer);
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('PII decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
};

// ==================== OBJECT-LEVEL ENCRYPTION ====================

export const encryptSensitiveFields = async <T extends Record<string, any>>(data: T): Promise<T> => {
  if (!isBackendEncryptionEnabled()) return data;

  const encrypted: Record<string, any> = { ...data }; // Use indexable copy to avoid TS2536 when assigning by dynamic string keys
  const fieldsToEncrypt = [...SENSITIVE_FIELDS.CRITICAL, ...SENSITIVE_FIELDS.HIGH];

  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field]) {
      const value = String(encrypted[field]);
      encrypted[field] = await encryptPII(value);
    }
  }

  if (encrypted.personalDetails && typeof encrypted.personalDetails === 'object') {
    const pd = encrypted.personalDetails as Record<string, any>;
    for (const field of fieldsToEncrypt) {
      if (field in pd && pd[field]) {
        pd[field] = await encryptPII(String(pd[field]));
      }
    }
  }

  return encrypted as T;
};

export const decryptSensitiveFields = async <T extends Record<string, any>>(data: T): Promise<T> => {
  const decrypted: Record<string, any> = { ...data };
  const fieldsToDecrypt = [...SENSITIVE_FIELDS.CRITICAL, ...SENSITIVE_FIELDS.HIGH];

  for (const field of fieldsToDecrypt) {
    if (field in decrypted && typeof decrypted[field] === 'object' && decrypted[field]?.encrypted) {
      decrypted[field] = await decryptPII(decrypted[field] as EncryptedField);
    }
  }

  if (decrypted.personalDetails && typeof decrypted.personalDetails === 'object') {
    const pd = decrypted.personalDetails as Record<string, any>;
    for (const field of fieldsToDecrypt) {
      if (field in pd && typeof pd[field] === 'object' && pd[field]?.encrypted) {
        pd[field] = await decryptPII(pd[field] as EncryptedField);
      }
    }
  }

  return decrypted as T;
};

export const generatePIIToken = (fieldType: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `PII_${fieldType.toUpperCase()}_${timestamp}_${random}`;
};

export const isPIIToken = (value: string): boolean => {
  return typeof value === 'string' && value.startsWith('PII_');
};

export const tokenizePII = (fieldType: string, value: string): { token: string; value: string } => {
  const token = generatePIIToken(fieldType);
  return { token, value };
};

// ==================== ENCRYPTION KEY MANAGEMENT ====================

export const initializeEncryptionKey = async (): Promise<void> => {
  try {
    const sessionKey = crypto.getRandomValues(new Uint8Array(32));
    const keyBase64 = btoa(String.fromCharCode(...Array.from(sessionKey)));
    sessionStorage.setItem('pii-encryption-key', keyBase64);
  } catch (error) {
    console.error('Failed to initialize encryption key:', error);
  }
};

export const clearEncryptionKey = (): void => {
  sessionStorage.removeItem('pii-encryption-key');
};

// ==================== UTILITY FUNCTIONS ====================

export const isSensitiveField = (fieldName: string): boolean => {
  return [
    ...SENSITIVE_FIELDS.CRITICAL,
    ...SENSITIVE_FIELDS.HIGH,
    ...SENSITIVE_FIELDS.MEDIUM,
  ].includes(fieldName);
};

export const getFieldSensitivity = (fieldName: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (SENSITIVE_FIELDS.CRITICAL.includes(fieldName)) return 'CRITICAL';
  if (SENSITIVE_FIELDS.HIGH.includes(fieldName)) return 'HIGH';
  if (SENSITIVE_FIELDS.MEDIUM.includes(fieldName)) return 'MEDIUM';
  return 'LOW';
};

export const validateEncryption = (data: Record<string, any>): boolean => {
  const criticalFields = SENSITIVE_FIELDS.CRITICAL;
  for (const field of criticalFields) {
    if (field in data && typeof data[field] === 'string') {
      console.warn(`Critical field "${field}" is not encrypted!`);
      return false;
    }
  }
  return true;
};

// ==================== EXPORT ====================

export default {
  encryptPII,
  decryptPII,
  encryptSensitiveFields,
  decryptSensitiveFields,
  tokenizePII,
  isPIIToken,
  generatePIIToken,
  initializeEncryptionKey,
  clearEncryptionKey,
  isSensitiveField,
  getFieldSensitivity,
  validateEncryption,
};
