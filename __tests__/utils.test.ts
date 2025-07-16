import { isUserVerified, getVerificationStatusText, formatPhoneE164, isValidPhoneE164 } from '@/lib/utils';

describe('User verification helpers', () => {
  it('isUserVerified returns true when profile.verification_status === "verified"', () => {
    expect(isUserVerified({ verification_status: 'verified' })).toBe(true);
  });

  it('isUserVerified returns true when account_status is premium or elite', () => {
    expect(isUserVerified({ account_status: 'premium' })).toBe(true);
    expect(isUserVerified({ account_status: 'elite' })).toBe(true);
  });

  it('isUserVerified returns false otherwise', () => {
    expect(isUserVerified({ verification_status: 'pending' })).toBe(false);
    expect(isUserVerified(undefined as any)).toBe(false);
  });
});

describe('getVerificationStatusText', () => {
  it('returns "Verified" for verified users', () => {
    expect(getVerificationStatusText({ verification_status: 'verified' })).toBe('Verified');
  });

  it('returns "Verification Rejected" when verification_status is rejected', () => {
    expect(getVerificationStatusText({ verification_status: 'rejected' })).toBe('Verification Rejected');
  });

  it('returns fast track text when fast_track_verification flag is true', () => {
    expect(getVerificationStatusText({ fast_track_verification: true })).toBe('Fast Track Verification');
  });

  it('returns "Profile Under Review" otherwise', () => {
    expect(getVerificationStatusText({ verification_status: 'pending' })).toBe('Profile Under Review');
  });

  it('returns "Unknown" when profile is null', () => {
    expect(getVerificationStatusText(null as any)).toBe('Unknown');
  });
});

describe('Phone helpers', () => {
  it('formats phone numbers to E.164', () => {
    expect(formatPhoneE164('(123) 456-7890')).toBe('+1234567890');
    expect(formatPhoneE164('9876543210')).toBe('+9876543210');
    expect(formatPhoneE164('')).toBe('');
  });

  it('validates E.164 phone numbers correctly', () => {
    expect(isValidPhoneE164('+1234567890')).toBe(true);
    expect(isValidPhoneE164('+19876543210')).toBe(true);
    expect(isValidPhoneE164('1234567890')).toBe(false);
    expect(isValidPhoneE164('+0123456789')).toBe(false);
  });
}); 