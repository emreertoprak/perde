import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { AppConfig } from '../../../config/env.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/app-error.js';
import type { StorageProvider, StoredObject } from '../application/storage.js';

function safePath(basePath: string, key: string): string {
  if (!/^[a-zA-Z0-9/_-]+$/.test(key) || key.includes('..'))
    throw new ValidationError('Invalid storage key');
  const base = resolve(basePath);
  const path = resolve(base, key);
  if (!path.startsWith(`${base}${sep}`)) throw new ValidationError('Invalid storage path');
  return path;
}

export class LocalStorageProvider implements StorageProvider {
  public constructor(private readonly basePath: string) {}

  public async put(object: StoredObject): Promise<void> {
    const path = safePath(this.basePath, object.key);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, object.body, { flag: 'wx' });
  }

  public async get(key: string): Promise<StoredObject> {
    try {
      return {
        key,
        contentType: 'application/octet-stream',
        body: await readFile(safePath(this.basePath, key)),
      };
    } catch (error) {
      if (isMissingFile(error)) throw new NotFoundError('FILE_NOT_FOUND', 'File not found');
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await unlink(safePath(this.basePath, key));
    } catch (error) {
      if (!isMissingFile(error)) throw error;
    }
  }

  public presignGet(key: string, expiresInSeconds: number): Promise<string> {
    void key;
    void expiresInSeconds;
    throw new ValidationError('Local storage does not provide presigned URLs');
  }
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  public constructor(private readonly config: AppConfig) {
    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: config.AWS_REGION,
      forcePathStyle: config.AWS_S3_FORCE_PATH_STYLE,
    };
    if (config.AWS_S3_ENDPOINT) clientConfig.endpoint = config.AWS_S3_ENDPOINT;
    if (config.AWS_ACCESS_KEY_ID) {
      clientConfig.credentials = {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      };
    }
    this.client = new S3Client(clientConfig);
  }

  public async put(object: StoredObject): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.AWS_S3_BUCKET,
        Key: object.key,
        Body: object.body,
        ContentType: object.contentType,
      }),
    );
  }

  public async get(key: string): Promise<StoredObject> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.AWS_S3_BUCKET, Key: key }),
    );
    if (!result.Body) throw new NotFoundError('FILE_NOT_FOUND', 'File not found');
    const body = Buffer.from(await result.Body.transformToByteArray());
    return { key, body, contentType: result.ContentType ?? 'application/octet-stream' };
  }

  public async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.AWS_S3_BUCKET, Key: key }),
    );
  }

  public presignGet(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.config.AWS_S3_BUCKET, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
