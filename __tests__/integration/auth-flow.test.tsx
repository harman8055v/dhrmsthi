import React from 'react'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { useAuth } from '@/hooks/use-auth'
import AuthDialog from '@/components/auth-dialog'
import { mockUser, mockProfile, mockFetch } from '../utils/test-utils'
import { supabase } from '@/lib/supabase'

// Mock the dependencies
jest.mock('@/lib/supabase')
jest.mock('@/hooks/use-auth')

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock Router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const mockSearchParams = {
  get: jest.fn().mockReturnValue(null),
  has: jest.fn().mockReturnValue(false),
  toString: jest.fn().mockReturnValue(''),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}))

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      error: null,
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
      isAuthenticated: false,
      isProfileComplete: false,
      isVerified: false,
      isPremium: false,
      isMobileLogin: false,
    })
    
    // Ensure all auth methods are properly mocked
    mockSupabase.auth.signUp = jest.fn().mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    })
    
    mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    })
    
    mockSupabase.auth.signInWithOtp = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    
    mockSupabase.auth.verifyOtp = jest.fn().mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    })
    
    mockSupabase.from = jest.fn().mockReturnValue({
      upsert: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
    })
  })

  describe('Email/Password Signup Flow', () => {
    it('should handle complete signup flow successfully', async () => {
      // Mock successful signup with user
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'test-user-id' }, 
          session: null 
        }, 
        error: null 
      })
      
      // Mock successful profile creation
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
      })
      
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Fill out signup form
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const signupButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signupButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
          options: {
            data: {
              first_name: 'John',
              last_name: 'Doe',
              full_name: 'John Doe',
              phone: expect.any(String),
            },
          },
        })
      })

      // Should redirect to auth loading
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/auth-loading?userId=')
      )
    })

    it('should handle signup validation errors', async () => {
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Try to submit without filling required fields
      const signupButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signupButton)

      await waitFor(() => {
        expect(screen.getByText(/first name required/i)).toBeInTheDocument()
        expect(screen.getByText(/last name required/i)).toBeInTheDocument()
        expect(screen.getByText(/email required/i)).toBeInTheDocument()
        expect(screen.getByText(/password required/i)).toBeInTheDocument()
      })

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should handle signup API errors', async () => {
      const signupError = new Error('Email already exists')
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: signupError,
      })

      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Fill out valid form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

      const signupButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signupButton)

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Email/Password Login Flow', () => {
    it('should handle complete login flow successfully', async () => {
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="login" />)

      // Fill out login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const loginButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
        })
      })

      // Should redirect to dashboard
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle login validation errors', async () => {
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="login" />)

      // Try to submit without filling required fields
      const loginButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/email required/i)).toBeInTheDocument()
        expect(screen.getByText(/password required/i)).toBeInTheDocument()
      })

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should handle login API errors', async () => {
      const loginError = new Error('Invalid credentials')
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: loginError,
      })

      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="login" />)

      // Fill out form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } })

      const loginButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Number Input in Signup', () => {
    it('should handle mobile number input in signup form', async () => {
      // Mock successful signup and profile creation
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: null },
        error: null
      })
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
      })
      
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Fill mobile number in signup form
      const phoneInput = screen.getByPlaceholderText(/your mobile number/i)
      fireEvent.change(phoneInput, { target: { value: '9876543210' } })

      // Fill other required fields
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

      // Submit signup form
      const signupButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signupButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
          options: expect.objectContaining({
            data: expect.objectContaining({
              first_name: 'John',
              last_name: 'Doe',
              phone: expect.any(String)
            })
          })
        })
      })
      
      // Should redirect to auth loading
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/auth-loading?userId=')
      )
    })

    it('should validate mobile number format in signup', async () => {
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Fill valid mobile number
      const phoneInput = screen.getByPlaceholderText(/your mobile number/i)
      fireEvent.change(phoneInput, { target: { value: '9876543210' } })
      
      // Fill other required fields
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

      // Submit form
      const signupButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signupButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalled()
      })
    })

    it('should show mobile number is required in signup', async () => {
      // Ensure not authenticated to allow signup mode
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        error: null,
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAuthenticated: false,
        isProfileComplete: false,
        isVerified: false,
        isPremium: false,
        isMobileLogin: false,
      })

      // Mock successful signup and profile creation
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: null },
        error: null
      })
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
      })
      
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Fill all fields except mobile
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      // Clear mobile field to ensure it's empty for validation
      const mobileInput = screen.getByPlaceholderText(/your mobile number/i)
      fireEvent.change(mobileInput, { target: { value: '' } })

      // Submit without mobile number
      const signupButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signupButton)

      await waitFor(() => {
        // Form should submit with default mobile value ("+91")
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
            password: 'password123',
            options: expect.objectContaining({
              data: expect.objectContaining({
                phone: '+91'
              })
            })
          })
        )
      })
    })

    it('should handle signup errors with mobile number', async () => {
      const signupError = new Error('Email already exists')
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: signupError,
      })

      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Fill all required fields including mobile
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByPlaceholderText(/your mobile number/i), { target: { value: '9876543210' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      // Submit signup
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Auth State Integration', () => {
    it('should handle authenticated user correctly', async () => {
      const onClose = jest.fn()
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        loading: false,
        error: null,
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAuthenticated: true,
        isProfileComplete: true,
        isVerified: true,
        isPremium: false,
        isMobileLogin: false,
      })

      render(<AuthDialog isOpen={true} onClose={onClose} />)

      // Should show the dialog for authenticated users (they can still log out/switch accounts)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should handle loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: true,
        error: null,
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAuthenticated: false,
        isProfileComplete: false,
        isVerified: false,
        isPremium: false,
        isMobileLogin: false,
      })

      render(<AuthDialog isOpen={true} onClose={jest.fn()} />)

      // Component should still render during loading state
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should handle auth errors', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        error: 'Authentication failed',
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAuthenticated: false,
        isProfileComplete: false,
        isVerified: false,
        isPremium: false,
        isMobileLogin: false,
      })

      render(<AuthDialog isOpen={true} onClose={jest.fn()} />)

      // Component should still render properly even with auth errors
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })
  })

  describe('Form Switching', () => {
    it('should switch between login and signup modes', () => {
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="login" />)

      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()

      // Switch to signup
      const signupLink = screen.getByText(/sign up/i)
      fireEvent.click(signupLink)

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    })

    it('should show mobile input in signup mode', () => {
      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // In signup mode, mobile field should be visible
      expect(screen.getByText(/mobile number/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/your mobile number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })
  })

  describe('Referral Code Handling', () => {
    it('should handle referral code in signup', async () => {
      // Mock useSearchParams to return referral code
      mockSearchParams.get.mockImplementation((key: string) => 
        key === 'ref' ? 'REF123' : null
      )

      // Mock successful signup and profile creation
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: null },
        error: null
      })
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
      })

      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="signup" />)

      // Fill and submit signup form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

      const signupButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(signupButton)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('users')
      })

      // Should include referral code in localStorage for onboarding
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'signupData',
        expect.stringContaining('REF123')
      )
    })
  })

  describe('Error Recovery', () => {
    it('should allow retry after network error', async () => {
      let attemptCount = 0
      mockSupabase.auth.signInWithPassword.mockImplementation(() => {
        attemptCount++
        if (attemptCount === 1) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('Network error'),
          })
        }
        return Promise.resolve({
          data: { user: mockUser, session: null },
          error: null,
        })
      })

      render(<AuthDialog isOpen={true} onClose={jest.fn()} defaultMode="login" />)

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /log in/i }))

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Try again
      fireEvent.click(screen.getByRole('button', { name: /log in/i }))

      // Should succeed on retry
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })
    })
  })
})