import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    if (!keyHex || keyHex.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
      );
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypts plaintext into a formatted string: "iv:authTag:encryptedData"
   */
  encrypt(plainText: string): string {
    try {
      const iv = randomBytes(12); // Standard 96-bit IV for GCM mode
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch {
      throw new InternalServerErrorException('Failed to encrypt data');
    }
  }

  /**
   * Decrypts "iv:authTag:encryptedData" back to plaintext
   */
  decrypt(cipherText: string): string {
    try {
      const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid ciphertext format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      throw new InternalServerErrorException('Failed to decrypt data');
    }
  }
}
