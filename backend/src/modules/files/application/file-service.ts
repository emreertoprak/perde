import { fileTypeFromBuffer } from 'file-type';

import type { TransactionManager } from '../../../database/transaction-manager.js';
import { sha256 } from '../../../shared/infrastructure/crypto.js';
import { ValidationError } from '../../../shared/domain/app-error.js';
import type {
  DrizzleFileRepository,
  FileRecord,
} from '../infrastructure/persistence/file-repository.js';
import type { StorageProvider } from './storage.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export class FileService {
  public constructor(
    private readonly transactions: TransactionManager,
    private readonly files: DrizzleFileRepository,
    private readonly storage: StorageProvider,
    private readonly providerName: string,
  ) {}

  public async upload(
    userId: string,
    input: {
      readonly originalName: string;
      readonly contentType: string;
      readonly visibility: 'private' | 'public';
      readonly body: Buffer;
    },
  ): Promise<FileRecord> {
    if (input.body.length === 0) throw new ValidationError('File cannot be empty');
    const detected = await fileTypeFromBuffer(input.body);
    if (!detected || !allowedMimeTypes.has(detected.mime) || detected.mime !== input.contentType) {
      throw new ValidationError(
        'File content type is not allowed or does not match its binary signature',
      );
    }
    const storageKey = `uploads/${new Date().toISOString().slice(0, 10)}/${sha256(input.body).slice(0, 32)}`;
    await this.storage.put({ key: storageKey, contentType: detected.mime, body: input.body });
    try {
      return await this.transactions.withinTransaction((transaction) =>
        this.files.create(
          {
            ownerUserId: userId,
            storageProvider: this.providerName,
            storageKey,
            originalName: input.originalName.replace(/[\\/\0]/g, '_').slice(0, 500),
            mimeType: detected.mime,
            sizeBytes: input.body.length,
            visibility: input.visibility,
            checksumSha256: sha256(input.body),
          },
          transaction,
        ),
      );
    } catch (error) {
      await this.storage.delete(storageKey);
      throw error;
    }
  }

  public async download(
    userId: string,
    fileId: string,
  ): Promise<{ readonly record: FileRecord; readonly body: Buffer }> {
    const record = await this.files.findOwned(fileId, userId);
    const object = await this.storage.get(record.storageKey);
    return { record, body: object.body };
  }

  public async presign(userId: string, fileId: string): Promise<string> {
    const record = await this.files.findOwned(fileId, userId);
    return this.storage.presignGet(record.storageKey, 300);
  }

  public async delete(userId: string, fileId: string): Promise<void> {
    const record = await this.files.findOwned(fileId, userId);
    await this.storage.delete(record.storageKey);
    await this.transactions.withinTransaction((transaction) =>
      this.files.softDelete(record.id, userId, transaction),
    );
  }
}
