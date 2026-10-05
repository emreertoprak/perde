import eslint from '@eslint/js';
import globals from 'globals';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'src/data/geo/**', 'playwright-report/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...astro.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y-x': jsxA11y, 'react-hooks': reactHooks },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Testlerde non-null assertion ve kisa arrow ifadeleri okunabilirligi artiriyor
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    // page.evaluate() icindeki kod tarayicida calisir
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  prettier,
]);
