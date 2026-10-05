export interface StoredObject {
  readonly key: string;
  readonly contentType: string;
  readonly body: Buffer;
}

export interface StorageProvider {
  put(object: StoredObject): Promise<void>;
  get(key: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  presignGet(key: string, expiresInSeconds: number): Promise<string>;
}
