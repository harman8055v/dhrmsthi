import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { mockUser, mockProfile } from '../utils/test-utils'
import { supabase } from '@/lib/supabase'
import { userService } from '@/lib/data-service'

// Mock the dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/data-service')
jest.mock('@/lib/logger')

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockUserService = userService as jest.Mocked<typeof userService>

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    })
    
    // Add missing mock for signOut
    mockSupabase.auth.signOut = jest.fn().mockResolvedValue({ error: null })
    
    mockUserService.getCurrentProfile.mockResolvedValue(mockProfile)
  })

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(result.current.error).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isProfileComplete).toBe(false)
      expect(result.current.isVerified).toBe(false)
      expect(result.current.isPremium).toBe(false)
    })
  })

  describe('Authentication State Management', () => {
    it('should handle successful session with profile', async () => {
      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isProfileComplete).toBe(true)
      expect(result.current.isVerified).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it('should handle session without profile', async () => {
      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      mockUserService.getCurrentProfile.mockRejectedValue(new Error('Profile not found'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toBe(null)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isProfileComplete).toBe(false)
      expect(result.current.error).toBe('Failed to load profile')
    })

    it('should handle no session', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isProfileComplete).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('Authentication Events', () => {
    it('should handle SIGNED_IN event', async () => {
      const { result } = renderHook(() => useAuth())
      
      // Wait for initial setup
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Get the onAuthStateChange mock and call it with SIGNED_IN
      const onAuthStateChangeMock = mockSupabase.auth.onAuthStateChange.mock.calls[0][0]
      
      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      await act(async () => {
        await onAuthStateChangeMock('SIGNED_IN', sessionWithUser)
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toEqual(mockProfile)
        expect(result.current.isAuthenticated).toBe(true)
      })
    })

    it('should handle SIGNED_OUT event', async () => {
      const { result } = renderHook(() => useAuth())
      
      // Setup initial authenticated state
      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Trigger SIGNED_OUT event
      const onAuthStateChangeMock = mockSupabase.auth.onAuthStateChange.mock.calls[0][0]
      
      await act(async () => {
        await onAuthStateChangeMock('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(result.current.user).toBe(null)
        expect(result.current.profile).toBe(null)
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.loading).toBe(false)
      })
    })

    it('should ignore PASSWORD_RECOVERY events', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const onAuthStateChangeMock = mockSupabase.auth.onAuthStateChange.mock.calls[0][0]
      const initialState = { ...result.current }

      await act(async () => {
        await onAuthStateChangeMock('PASSWORD_RECOVERY', null)
      })

      // State should remain unchanged
      expect(result.current.user).toBe(initialState.user)
      expect(result.current.profile).toBe(initialState.profile)
      expect(result.current.loading).toBe(initialState.loading)
    })
  })

  describe('Sign Out Functionality', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.loading).toBe(false)
    })

    it('should handle sign out error', async () => {
      // Setup authenticated state first
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })
      
      const signOutError = new Error('Sign out failed')
      mockSupabase.auth.signOut.mockResolvedValue({ error: signOutError })

      const { result } = renderHook(() => useAuth())

      // Wait for initial auth state to be set
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to sign out')
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Profile Refresh', () => {
    it('should refresh profile successfully', async () => {
      // Setup initial authenticated state
      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Update mock profile
      const updatedProfile = { ...mockProfile, first_name: 'Updated' }
      mockUserService.getCurrentProfile.mockResolvedValue(updatedProfile)

      await act(async () => {
        await result.current.refreshProfile()
      })

      expect(result.current.profile?.first_name).toBe('Updated')
      expect(result.current.error).toBe(null)
    })

    it('should handle refresh profile error', async () => {
      // Setup initial authenticated state
      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Mock refresh failure
      mockUserService.getCurrentProfile.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.refreshProfile()
      })

      expect(result.current.error).toBe('Failed to refresh profile')
      expect(result.current.loading).toBe(false)
    })

    it('should not refresh profile if user is not authenticated', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockUserService.getCurrentProfile.mockClear()

      await act(async () => {
        await result.current.refreshProfile()
      })

      expect(mockUserService.getCurrentProfile).not.toHaveBeenCalled()
    })
  })

  describe('Premium Status Calculation', () => {
    it('should identify premium users correctly', async () => {
      const premiumProfile = { ...mockProfile, account_status: 'sangam' as const }
      mockUserService.getCurrentProfile.mockResolvedValue(premiumProfile)

      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isPremium).toBe(true)
      })
    })

    it('should identify free users correctly', async () => {
      const freeProfile = { ...mockProfile, account_status: 'drishti' as const }
      mockUserService.getCurrentProfile.mockResolvedValue(freeProfile)

      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isPremium).toBe(false)
      })
    })
  })

  describe('Verification Status', () => {
    it('should identify verified users correctly', async () => {
      const verifiedProfile = { ...mockProfile, verification_status: 'verified' as const }
      mockUserService.getCurrentProfile.mockResolvedValue(verifiedProfile)

      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isVerified).toBe(true)
      })
    })

    it('should identify non-verified users correctly', async () => {
      const unverifiedProfile = { ...mockProfile, verification_status: 'pending' as const }
      mockUserService.getCurrentProfile.mockResolvedValue(unverifiedProfile)

      const sessionWithUser = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isVerified).toBe(false)
      })
    })
  })
}) 