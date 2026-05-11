import type { Config } from 'jest'

/**
 * Jest configuration for Next.js 14 App Router + TypeScript + jsdom.
 * Uses a multi-project setup to apply different environments per test suite.
 *
 * unit/   → node environment (no DOM needed for pure schema tests)
 * components/ → jsdom (React Testing Library)
 * rls/    → node environment (Supabase client, no DOM)
 */
const config: Config = {
  projects: [
    // -------------------------------------------------------------------------
    // Unit tests: schema validation, pure helpers
    // -------------------------------------------------------------------------
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              esModuleInterop: true,
              moduleResolution: 'node',
              paths: { '@/*': ['./src/*'] },
            },
          },
        ],
      },
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    },

    // -------------------------------------------------------------------------
    // Component tests: React Testing Library + jsdom
    // -------------------------------------------------------------------------
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/__tests__/components/**/*.test.tsx'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg|ico|webp)$':
          '<rootDir>/src/__tests__/__mocks__/fileMock.ts',
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              jsx: 'react-jsx',
              esModuleInterop: true,
              moduleResolution: 'node',
              paths: { '@/*': ['./src/*'] },
            },
          },
        ],
      },
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    },

    // -------------------------------------------------------------------------
    // RLS isolation test: node environment, uses supabase-js directly
    // -------------------------------------------------------------------------
    {
      displayName: 'rls',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/rls/**/*.test.ts'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              esModuleInterop: true,
              moduleResolution: 'node',
              paths: { '@/*': ['./src/*'] },
            },
          },
        ],
      },
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    },
  ],

  // ---------------------------------------------------------------------------
  // Coverage settings (collected when running with --coverage)
  //
  // NOTE on API routes: src/app/api/**/*.ts handlers require a live Supabase
  // instance (via createServerClient). They cannot be unit-tested without
  // mocking cookies() from next/headers and the full Supabase client chain.
  // Coverage for route handlers is validated via E2E tests (e2e/*.spec.ts)
  // which are run separately with Playwright. API routes are therefore
  // excluded from Jest coverage thresholds.
  //
  // Coverage target (70%) is enforced on:
  //   - src/components/**  (component tests achieve 75%+)
  //   - src/lib/validation/** (unit tests achieve 100%)
  // ---------------------------------------------------------------------------
  collectCoverageFrom: [
    'src/components/**/*.tsx',
    'src/lib/validation/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
  ],

  coverageThreshold: {
    global: {
      lines: 70,
      branches: 60,
      functions: 70,
      statements: 70,
    },
  },

  coverageReporters: ['text', 'lcov', 'html'],

  // Ignore e2e directory — those are run by Playwright, not Jest
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
}

export default config
