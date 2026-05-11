/**
 * Jest global setup file.
 * Loaded via setupFilesAfterEnv in jest.config.ts.
 *
 * - Extends expect with @testing-library/jest-dom matchers.
 * - Sets up any global mocks needed across all test suites.
 */
import '@testing-library/jest-dom'
