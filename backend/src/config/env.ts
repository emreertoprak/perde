import 'dotenv/config';

import { z } from 'zod';

const booleanFromEnv = z.enum(['true', 'false']).transform((value) => value === 'true');
const integerFromEnv = (minimum: number, maximum: number) =>
  z.coerce.number().int().min(minimum).max(maximum);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: integerFromEnv(1, 65_535).default(3000),
    APP_NAME: z.string().trim().min(1).default('Backend Starter Kit'),
    APP_URL: z.url(),
    WEB_APP_URL: z.url(),
    API_PREFIX: z
      .string()
      .regex(/^\/[a-z0-9/-]*$/i)
      .default('/api'),
    API_VERSION: z
      .string()
      .regex(/^v\d+$/)
      .default('v1'),
    TRUST_PROXY: booleanFromEnv.default(false),
    DATABASE_URL: z.url().refine((url) => url.startsWith('postgres'), 'Must be a PostgreSQL URL'),
    DATABASE_MAX_CONNECTIONS: integerFromEnv(1, 100).default(10),
    DATABASE_SSL: booleanFromEnv.default(false),
    REDIS_URL: z.url().refine((url) => url.startsWith('redis'), 'Must be a Redis URL'),
    REDIS_PREFIX: z.string().trim().min(1).default('backend-starter'),
    JWT_ISSUER: z.string().trim().min(1),
    JWT_AUDIENCE: z.string().trim().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_PREVIOUS_SECRETS: z.string().default(''),
    JWT_REFRESH_PREVIOUS_SECRETS: z.string().default(''),
    JWT_ACCESS_EXPIRES_IN_SECONDS: integerFromEnv(60, 3_600).default(900),
    JWT_REFRESH_EXPIRES_IN_SECONDS: integerFromEnv(3_600, 7_776_000).default(2_592_000),
    REFRESH_COOKIE_NAME: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .default('backend_refresh'),
    CSRF_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().min(43),
    CORS_ORIGINS: z.string().min(1),
    COOKIE_DOMAIN: z.string().trim().optional().default(''),
    RATE_LIMIT_WINDOW_MS: integerFromEnv(1_000, 86_400_000).default(900_000),
    RATE_LIMIT_MAX_REQUESTS: integerFromEnv(1, 100_000).default(100),
    LOGIN_RATE_LIMIT_MAX: integerFromEnv(1, 1_000).default(10),
    FORGOT_PASSWORD_RATE_LIMIT_MAX: integerFromEnv(1, 1_000).default(5),
    GOOGLE_LOGIN_ENABLED: booleanFromEnv.default(false),
    GOOGLE_CLIENT_ID: z.string().default(''),
    GOOGLE_CLIENT_SECRET: z.string().default(''),
    GOOGLE_CALLBACK_URL: z.string().default(''),
    APPLE_LOGIN_ENABLED: booleanFromEnv.default(false),
    APPLE_CLIENT_ID: z.string().default(''),
    APPLE_TEAM_ID: z.string().default(''),
    APPLE_KEY_ID: z.string().default(''),
    APPLE_PRIVATE_KEY: z.string().default(''),
    APPLE_CALLBACK_URL: z.string().default(''),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: integerFromEnv(1, 65_535).default(1025),
    SMTP_USER: z.string().default(''),
    SMTP_PASSWORD: z.string().default(''),
    SMTP_FROM: z.string().min(3),
    STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
    LOCAL_STORAGE_PATH: z.string().min(1).default('./storage'),
    MAX_UPLOAD_BYTES: integerFromEnv(1, 104_857_600).default(10_485_760),
    AWS_ACCESS_KEY_ID: z.string().default(''),
    AWS_SECRET_ACCESS_KEY: z.string().default(''),
    AWS_REGION: z.string().default('us-east-1'),
    AWS_S3_BUCKET: z.string().default(''),
    AWS_S3_ENDPOINT: z.string().default(''),
    AWS_S3_FORCE_PATH_STYLE: booleanFromEnv.default(false),
    SENTRY_DSN: z.string().default(''),
    SENTRY_ENVIRONMENT: z.string().default('development'),
    SENTRY_RELEASE: z.string().default(''),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
    POSTHOG_API_KEY: z.string().default(''),
    POSTHOG_HOST: z.url().default('https://us.i.posthog.com'),
    LOKI_HOST: z.string().default(''),
    LOKI_BASIC_AUTH_USER: z.string().default(''),
    LOKI_TOKEN: z.string().default(''),
    METRICS_TOKEN: z.string().default(''),
    DOCS_ENABLED: booleanFromEnv.default(true),
    QUEUE_DASHBOARD_ENABLED: booleanFromEnv.default(true),
    WEBHOOK_HMAC_SECRET: z.string().min(32),
    WEBHOOK_TOLERANCE_SECONDS: integerFromEnv(30, 3_600).default(300),
    SEED_ADMIN_EMAIL: z.email().optional().or(z.literal('')).default(''),
    SEED_ADMIN_PASSWORD: z.string().optional().default(''),
  })
  .superRefine((value, context) => {
    const required = (enabled: boolean, fields: (keyof typeof value)[], name: string): void => {
      if (!enabled) return;
      for (const field of fields) {
        if (!value[field]) {
          context.addIssue({ code: 'custom', path: [field], message: `${name} requires ${field}` });
        }
      }
    };
    required(
      value.GOOGLE_LOGIN_ENABLED,
      ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'],
      'Google OAuth',
    );
    required(
      value.APPLE_LOGIN_ENABLED,
      [
        'APPLE_CLIENT_ID',
        'APPLE_TEAM_ID',
        'APPLE_KEY_ID',
        'APPLE_PRIVATE_KEY',
        'APPLE_CALLBACK_URL',
      ],
      'Apple Sign In',
    );
    if (value.STORAGE_PROVIDER === 's3') {
      required(true, ['AWS_S3_BUCKET'], 'S3 storage');
    }
    if (Buffer.from(value.ENCRYPTION_KEY, 'base64').length !== 32) {
      context.addIssue({
        code: 'custom',
        path: ['ENCRYPTION_KEY'],
        message: 'ENCRYPTION_KEY must decode to exactly 32 bytes',
      });
    }
  });

export type Env = z.infer<typeof environmentSchema>;

export type AppConfig = Omit<
  Env,
  'CORS_ORIGINS' | 'JWT_ACCESS_PREVIOUS_SECRETS' | 'JWT_REFRESH_PREVIOUS_SECRETS'
> & {
  readonly corsOrigins: readonly string[];
  readonly jwtAccessVerificationSecrets: readonly string[];
  readonly jwtRefreshVerificationSecrets: readonly string[];
  readonly apiBasePath: string;
  readonly isProduction: boolean;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const value = parsed.data;
  const split = (input: string): readonly string[] =>
    input
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  return {
    ...value,
    corsOrigins: split(value.CORS_ORIGINS),
    jwtAccessVerificationSecrets: [
      value.JWT_ACCESS_SECRET,
      ...split(value.JWT_ACCESS_PREVIOUS_SECRETS),
    ],
    jwtRefreshVerificationSecrets: [
      value.JWT_REFRESH_SECRET,
      ...split(value.JWT_REFRESH_PREVIOUS_SECRETS),
    ],
    apiBasePath: `${value.API_PREFIX}/${value.API_VERSION}`,
    isProduction: value.NODE_ENV === 'production',
  };
}
