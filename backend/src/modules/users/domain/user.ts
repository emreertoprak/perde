export type UserStatus = 'active' | 'inactive' | 'deleted';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly normalizedEmail: string;
  readonly passwordHash: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly displayName: string | null;
  readonly emailVerifiedAt: Date | null;
  readonly status: UserStatus;
  readonly failedLoginAttempts: number;
  readonly lockedUntil: Date | null;
  readonly analyticsOptOut: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly displayName: string | null;
  readonly emailVerified: boolean;
  readonly status: UserStatus;
  readonly createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    emailVerified: user.emailVerifiedAt !== null,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}
