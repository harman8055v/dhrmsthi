import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProfile } from '@/lib/data-service'

// Create a new QueryClient for each test to ensure clean state
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Test wrapper for components that need providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data factories
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  phone: '+919876543210',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {
    first_name: 'Test',
    last_name: 'User',
  },
  aud: 'authenticated',
  confirmation_sent_at: '2023-01-01T00:00:00Z',
  confirmed_at: '2023-01-01T00:00:00Z',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone_confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  role: 'authenticated',
}

export const mockProfile: UserProfile = {
  id: 'test-user-id',
  phone: '+919876543210',
  email: 'test@example.com',
  mobile_verified: true,
  email_verified: true,
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  gender: 'Male',
  birthdate: '1990-01-01',
  height_ft: 5,
  height_in: 10,
  city_id: 1,
  state_id: 1,
  country_id: 1,
  spiritual_org: ['Arya Samaj'],
  daily_practices: ['Meditation', 'Yoga'],
  temple_visit_freq: 'Weekly',
  vanaprastha_interest: 'open',
  artha_vs_moksha: 'Balance',
  favorite_spiritual_quote: 'Om Shanti Shanti Shanti',
  education: 'Bachelors',
  profession: 'Software Engineer',
  annual_income: '5-10 lakhs',
  diet: 'Vegetarian',
  marital_status: 'Never Married',
  mother_tongue: 'Hindi',
  about_me: 'Test user profile',
  ideal_partner_notes: 'Looking for a spiritual partner',
  profile_photo_url: 'https://example.com/photo.jpg',
  user_photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  is_onboarded: true,
  verification_status: 'verified',
  account_status: 'drishti',
  premium_expires_at: '2024-12-31T23:59:59Z',
  super_likes_count: 5,
  swipe_count: 10,
  message_highlights_count: 3,
  referral_code: 'TEST123',
  referred_by: null,
  profile_score: 8,
  profile_scored_at: '2023-01-01T00:00:00Z',
  profile_scored_by: 'admin-id',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

export const mockSwipeStats = {
  daily_swipes_used: 3,
  daily_swipes_limit: 5,
  daily_superlikes_used: 1,
  daily_superlikes_limit: 1,
  can_swipe: true,
  super_likes_available: 2,
  undo_available: true,
}

export const mockMatch = {
  id: 'match-1',
  user1_id: 'test-user-id',
  user2_id: 'other-user-id',
  created_at: '2023-01-01T00:00:00Z',
  last_message_at: '2023-01-01T12:00:00Z',
}

export const mockMessage = {
  id: 'message-1',
  match_id: 'match-1',
  sender_id: 'test-user-id',
  content: 'Hello there!',
  is_highlighted: false,
  created_at: '2023-01-01T12:00:00Z',
  read_at: null,
}

export const mockProfiles = [
  {
    ...mockProfile,
    id: 'profile-1',
    first_name: 'Alice',
    last_name: 'Smith',
    full_name: 'Alice Smith',
    age: 25,
  },
  {
    ...mockProfile,
    id: 'profile-2',
    first_name: 'Bob',
    last_name: 'Johnson',
    full_name: 'Bob Johnson',
    age: 28,
    gender: 'Male' as const,
  },
  {
    ...mockProfile,
    id: 'profile-3',
    first_name: 'Carol',
    last_name: 'Davis',
    full_name: 'Carol Davis',
    age: 26,
    gender: 'Female' as const,
  },
]

// Mock API responses
export const mockApiResponses = {
  swipeSuccess: {
    success: true,
    is_match: false,
  },
  swipeMatch: {
    success: true,
    is_match: true,
  },
  swipeError: {
    success: false,
    error: 'Daily swipe limit reached',
  },
  profilesResponse: {
    data: mockProfiles,
    error: null,
  },
  swipeStatsResponse: {
    data: mockSwipeStats,
    error: null,
  },
}

// Helper functions for testing
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument()
  })
}

export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
  })
}

export const mockFetchError = (error: string, status = 500) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ error }),
    text: jest.fn().mockResolvedValue(JSON.stringify({ error })),
  })
}

export const mockSupabaseQuery = (data: any, error: any = null) => {
  const mockQuery = {
    data,
    error,
  }
  return jest.fn().mockResolvedValue(mockQuery)
}

// Custom matchers for better assertions
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectToBeDisabled = (element: HTMLElement | null) => {
  expect(element).toBeDisabled()
}

export const expectToBeEnabled = (element: HTMLElement | null) => {
  expect(element).not.toBeDisabled()
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Add act import for proper state update wrapping
export { act } from 'react'

// Helper to wrap async operations in act
export const actAsync = async (fn: () => Promise<void>) => {
  const { act } = await import('react')
  await act(async () => {
    await fn()
  })
} 