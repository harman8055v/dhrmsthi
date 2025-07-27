import { 
  cn, 
  isUserVerified, 
  getAvatarInitials, 
  canAccessVerifiedFeatures, 
  getVerificationStatusText,
  formatPhoneE164,
  isValidPhoneE164 
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('base', 'additional')).toBe('base additional')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle Tailwind merge conflicts', () => {
      expect(cn('px-2 py-1 px-4')).toBe('py-1 px-4')
    })

    it('should handle empty or undefined inputs', () => {
      expect(cn()).toBe('')
      expect(cn('', undefined, null)).toBe('')
    })
  })

  describe('isUserVerified', () => {
    it('should return false for null/undefined profile', () => {
      expect(isUserVerified(null)).toBe(false)
      expect(isUserVerified(undefined)).toBe(false)
    })

    it('should return true for verified status', () => {
      const profile = { verification_status: 'verified' }
      expect(isUserVerified(profile)).toBe(true)
    })

    it('should return true for premium account status', () => {
      const sangamProfile = { account_status: 'sangam' }
      const samarpanProfile = { account_status: 'samarpan' }
      
      expect(isUserVerified(sangamProfile)).toBe(true)
      expect(isUserVerified(samarpanProfile)).toBe(true)
    })

    it('should return false for non-verified profiles', () => {
      const profile = { 
        verification_status: 'pending', 
        account_status: 'drishti' 
      }
      expect(isUserVerified(profile)).toBe(false)
    })

    it('should return false for empty profiles', () => {
      expect(isUserVerified({})).toBe(false)
    })
  })

  describe('getAvatarInitials', () => {
    it('should generate initials from first and last name', () => {
      expect(getAvatarInitials('John', 'Doe')).toBe('JD')
      expect(getAvatarInitials('Alice', 'Smith')).toBe('AS')
    })

    it('should handle only first name', () => {
      expect(getAvatarInitials('John', null)).toBe('J')
      expect(getAvatarInitials('Alice', '')).toBe('A')
    })

    it('should handle only last name', () => {
      expect(getAvatarInitials(null, 'Doe')).toBe('D')
      expect(getAvatarInitials('', 'Smith')).toBe('S')
    })

    it('should return fallback for empty names', () => {
      expect(getAvatarInitials(null, null)).toBe('U')
      expect(getAvatarInitials('', '')).toBe('U')
      expect(getAvatarInitials('   ', '   ')).toBe('U')
    })

    it('should handle uppercase and lowercase correctly', () => {
      expect(getAvatarInitials('john', 'doe')).toBe('JD')
      expect(getAvatarInitials('ALICE', 'SMITH')).toBe('AS')
    })

    it('should handle non-alphabetic characters', () => {
      expect(getAvatarInitials('123', 'Doe')).toBe('D')
      expect(getAvatarInitials('John', '456')).toBe('J')
      expect(getAvatarInitials('!@#', '$%^')).toBe('U')
    })

    it('should trim whitespace', () => {
      expect(getAvatarInitials('  John  ', '  Doe  ')).toBe('JD')
    })
  })

  describe('canAccessVerifiedFeatures', () => {
    it('should return same result as isUserVerified', () => {
      const verifiedProfile = { verification_status: 'verified' }
      const unverifiedProfile = { verification_status: 'pending' }
      
      expect(canAccessVerifiedFeatures(verifiedProfile)).toBe(true)
      expect(canAccessVerifiedFeatures(unverifiedProfile)).toBe(false)
      expect(canAccessVerifiedFeatures(null)).toBe(false)
    })
  })

  describe('getVerificationStatusText', () => {
    it('should return "Unknown" for null/undefined profile', () => {
      expect(getVerificationStatusText(null)).toBe('Unknown')
      expect(getVerificationStatusText(undefined)).toBe('Unknown')
    })

    it('should return "Verified" for verified users', () => {
      const verifiedProfile = { verification_status: 'verified' }
      const premiumProfile = { account_status: 'sangam' }
      
      expect(getVerificationStatusText(verifiedProfile)).toBe('Verified')
      expect(getVerificationStatusText(premiumProfile)).toBe('Verified')
    })

    it('should return "Verification Rejected" for rejected status', () => {
      const rejectedProfile = { verification_status: 'rejected' }
      expect(getVerificationStatusText(rejectedProfile)).toBe('Verification Rejected')
    })

    it('should return "Fast Track Verification" for fast track users', () => {
      const fastTrackProfile = { fast_track_verification: true }
      expect(getVerificationStatusText(fastTrackProfile)).toBe('Fast Track Verification')
    })

    it('should return "Profile Under Review" as default', () => {
      const pendingProfile = { verification_status: 'pending' }
      const emptyProfile = {}
      
      expect(getVerificationStatusText(pendingProfile)).toBe('Profile Under Review')
      expect(getVerificationStatusText(emptyProfile)).toBe('Profile Under Review')
    })
  })

  describe('formatPhoneE164', () => {
    it('should format Indian phone numbers', () => {
      expect(formatPhoneE164('9876543210')).toBe('+9876543210')
      expect(formatPhoneE164('+919876543210')).toBe('+919876543210')
    })

    it('should format US phone numbers', () => {
      expect(formatPhoneE164('1234567890')).toBe('+1234567890')
      expect(formatPhoneE164('+11234567890')).toBe('+11234567890')
    })

    it('should handle phone numbers with formatting', () => {
      expect(formatPhoneE164('(987) 654-3210')).toBe('+9876543210')
      expect(formatPhoneE164('+91 98765 43210')).toBe('+919876543210')
      expect(formatPhoneE164('+1-234-567-8900')).toBe('+12345678900')
    })

    it('should return empty string for invalid input', () => {
      expect(formatPhoneE164('')).toBe('')
      expect(formatPhoneE164('abc')).toBe('')
      expect(formatPhoneE164('+++')).toBe('')
    })

    it('should strip all non-digit characters except plus', () => {
      expect(formatPhoneE164('abc987def654ghi3210')).toBe('+9876543210')
    })
  })

  describe('isValidPhoneE164', () => {
    it('should validate correct E.164 format', () => {
      expect(isValidPhoneE164('+919876543210')).toBe(true)
      expect(isValidPhoneE164('+12345678900')).toBe(true)
      expect(isValidPhoneE164('+44123456789')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidPhoneE164('9876543210')).toBe(false) // No +
      expect(isValidPhoneE164('+0876543210')).toBe(false) // Country code can't start with 0
      expect(isValidPhoneE164('+91987654321012345')).toBe(false) // Too long
      expect(isValidPhoneE164('+91987')).toBe(false) // Too short
    })

    it('should reject empty or invalid input', () => {
      expect(isValidPhoneE164('')).toBe(false)
      expect(isValidPhoneE164('+abc')).toBe(false)
      expect(isValidPhoneE164('abc')).toBe(false)
    })

    it('should require country code not starting with 0', () => {
      expect(isValidPhoneE164('+0123456789')).toBe(false)
      expect(isValidPhoneE164('+1123456789')).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(isUserVerified(null)).toBe(false)
      expect(getAvatarInitials(null, null)).toBe('U')
      expect(canAccessVerifiedFeatures(null)).toBe(false)
      expect(getVerificationStatusText(null)).toBe('Unknown')
      expect(formatPhoneE164('')).toBe('')
      expect(isValidPhoneE164('')).toBe(false)
    })

    it('should handle empty object inputs', () => {
      expect(isUserVerified({})).toBe(false)
      expect(canAccessVerifiedFeatures({})).toBe(false)
      expect(getVerificationStatusText({})).toBe('Profile Under Review')
    })

    it('should handle string type validation', () => {
      expect(getAvatarInitials(123 as any, 456 as any)).toBe('U')
      expect(formatPhoneE164(null as any)).toBe('')
      expect(isValidPhoneE164(null as any)).toBe(false)
    })
  })
}) 