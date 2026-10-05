export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly tokenFamilyId: string;
  readonly refreshTokenHash: string;
  readonly deviceId: string | null;
  readonly deviceName: string | null;
  readonly platform: string | null;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly lastUsedAt: Date;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly revokeReason: string | null;
  readonly replacedBySessionId: string | null;
  readonly createdAt: Date;
}

export interface SessionDeviceInput {
  readonly deviceId?: string | undefined;
  readonly deviceName?: string | undefined;
  readonly platform?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly ipAddress?: string | undefined;
}
