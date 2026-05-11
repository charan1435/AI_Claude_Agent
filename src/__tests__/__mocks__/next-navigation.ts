/**
 * Manual mock for next/navigation.
 * Used in component tests that render components using useRouter or useSearchParams.
 */

export const mockPush = jest.fn()
export const mockRefresh = jest.fn()
export const mockReplace = jest.fn()
export const mockBack = jest.fn()

export const mockSearchParams = new URLSearchParams()

export const useRouter = jest.fn(() => ({
  push: mockPush,
  refresh: mockRefresh,
  replace: mockReplace,
  back: mockBack,
  forward: jest.fn(),
  prefetch: jest.fn(),
}))

export const useSearchParams = jest.fn(() => mockSearchParams)

export const usePathname = jest.fn(() => '/')

export const useParams = jest.fn(() => ({}))

// Reset all mocks between tests
export function resetNavigationMocks() {
  mockPush.mockReset()
  mockRefresh.mockReset()
  mockReplace.mockReset()
  mockBack.mockReset()
}
