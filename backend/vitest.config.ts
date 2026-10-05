import { defineConfig } from 'vitest/config';

const coverage = {
  provider: 'v8' as const,
  reporter: ['text', 'json', 'html'],
  thresholds: { lines: 80, statements: 80, functions: 80, branches: 75 },
  exclude: ['dist/**', 'src/database/migrations/**', 'src/database/schema/**'],
};

export default defineConfig({
  test: {
    coverage,
    projects: [
      { test: { name: 'unit', include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'] } },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          testTimeout: 60_000,
        },
      },
      { test: { name: 'e2e', include: ['tests/e2e/**/*.test.ts'], testTimeout: 60_000 } },
    ],
  },
});
