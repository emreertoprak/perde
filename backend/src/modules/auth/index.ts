export {
  authAccounts,
  emailVerificationTokens,
  passwordResetTokens,
} from './infrastructure/persistence/schema.js';
export { DrizzleOneTimeTokenRepository } from './infrastructure/persistence/auth-token-repository.js';
export { AuthService, normalizeEmail } from './application/auth-service.js';
export type { AuthTokens, LoginInput, RegisterInput } from './application/auth-service.js';
export type { OneTimeTokenRepository } from './application/auth-token-repository.js';
export { createAuthRouter } from './presentation/auth-routes.js';
