import { and, eq, isNull } from 'drizzle-orm';

import type { DatabaseExecutor } from '../../../../database/client.js';
import { NotFoundError } from '../../../../shared/domain/app-error.js';
import { files } from './schema.js';

export interface FileRecord {
  readonly id: string;
  readonly ownerUserId: string | null;
  readonly storageProvider: string;
  readonly storageKey: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly visibility: string;
  readonly checksumSha256: string;
}

export class DrizzleFileRepository {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async create(
    input: Omit<FileRecord, 'id'>,
    executor: DatabaseExecutor,
  ): Promise<FileRecord> {
    const [row] = await executor.insert(files).values(input).returning({
      id: files.id,
      ownerUserId: files.ownerUserId,
      storageProvider: files.storageProvider,
      storageKey: files.storageKey,
      originalName: files.originalName,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      visibility: files.visibility,
      checksumSha256: files.checksumSha256,
    });
    if (!row) throw new Error('File insert returned no row');
    return row;
  }

  public async findOwned(id: string, userId: string): Promise<FileRecord> {
    const [row] = await this.database
      .select({
        id: files.id,
        ownerUserId: files.ownerUserId,
        storageProvider: files.storageProvider,
        storageKey: files.storageKey,
        originalName: files.originalName,
        mimeType: files.mimeType,
        sizeBytes: files.sizeBytes,
        visibility: files.visibility,
        checksumSha256: files.checksumSha256,
      })
      .from(files)
      .where(and(eq(files.id, id), eq(files.ownerUserId, userId), isNull(files.deletedAt)))
      .limit(1);
    if (!row) throw new NotFoundError('FILE_NOT_FOUND', 'File not found');
    return row;
  }

  public async softDelete(id: string, userId: string, executor: DatabaseExecutor): Promise<void> {
    await executor
      .update(files)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(files.id, id), eq(files.ownerUserId, userId)));
  }
}
