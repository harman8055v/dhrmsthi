# Testing Guide for DharmaSaathi

## Overview

This document outlines the comprehensive testing strategy implemented for the DharmaSaathi platform. The testing suite covers unit tests, integration tests, and component tests to ensure code quality and reliability.

## Test Setup

### Testing Stack
- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **@testing-library/user-event**: User interaction simulation
- **MSW (Mock Service Worker)**: API mocking for integration tests

### Configuration Files
- `jest.config.js`: Jest configuration with Next.js support
- `jest.setup.js`: Global test setup and mocks
- `__tests__/utils/test-utils.tsx`: Custom testing utilities and mock data

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, coverage report)
npm run test:ci
```

### Test Organization
```
__tests__/
├── utils/
│   └── test-utils.tsx          # Test utilities and mock data
├── hooks/
│   ├── use-auth.test.tsx       # Authentication hook tests
│   └── use-messages.test.tsx   # Messaging hook tests
├── components/
│   └── swipe-stack.test.tsx    # Component tests
├── api/
│   └── swipe.test.ts           # API route tests
├── lib/
│   └── utils.test.ts           # Utility function tests
└── integration/
    └── auth-flow.test.tsx      # Integration tests
```

## Test Coverage

### Current Coverage Goals
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Coverage Areas

#### ✅ Fully Tested Components
- **Authentication System**
  - `useAuth` hook with all auth states
  - Email/password and OTP authentication flows
  - Session management and error handling
  - Password recovery (ignoring in hook as per requirements)

- **Swipe System**
  - SwipeStack component with user verification
  - Swipe actions (like, dislike, superlike)
  - Daily limits and premium features
  - Animation states and error handling

- **Messaging System**
  - `useMessages` hook with real-time subscriptions
  - Message sending and receiving
  - Read status management
  - Real-time updates via Supabase channels

- **API Routes**
  - `/api/swipe` - Authentication, limits, and business logic
  - Error handling and validation
  - Database operations and match detection

- **Utility Functions**
  - User verification status
  - Data formatting (height, income, time)
  - Phone number validation
  - Age calculation and name initials

#### 🔄 Integration Tests
- **Authentication Flow**
  - Complete signup and login processes
  - Form validation and error states
  - Navigation and state management
  - Referral code handling

## Testing Utilities

### Mock Data
The test suite includes comprehensive mock data factories:
```typescript
// User and profile mocks
export const mockUser = { /* Supabase user object */ }
export const mockProfile = { /* Complete user profile */ }
export const mockProfiles = [ /* Array of test profiles */ ]

// API response mocks
export const mockApiResponses = {
  swipeSuccess: { success: true, is_match: false },
  swipeMatch: { success: true, is_match: true },
  swipeError: { success: false, error: 'Daily limit reached' }
}
```

### Test Helpers
```typescript
// Custom render with providers
import { render } from '../utils/test-utils'

// Mock API responses
mockFetch(response, status)
mockFetchError(error, status)

// Assertion helpers
expectToBeInDocument(element)
expectToHaveText(element, text)
```

## Mocking Strategy

### External Services
- **Supabase**: Comprehensive mocking of auth, database, and real-time features
- **Next.js**: Router, navigation, and image components
- **Framer Motion**: Animation components
- **Toast notifications**: Success/error feedback

### Real-time Features
- **Supabase Channels**: Mocked subscription and unsubscription
- **Message Updates**: Simulated real-time message events
- **State Synchronization**: Local state updates via mocked events

## Best Practices

### Test Writing Guidelines
1. **Arrange, Act, Assert**: Clear test structure
2. **Descriptive Names**: Tests should read like specifications
3. **Isolated Tests**: Each test should be independent
4. **Mock External Dependencies**: Don't test third-party libraries
5. **Test User Behavior**: Focus on user interactions, not implementation

### Example Test Structure
```typescript
describe('Component/Feature Name', () => {
  beforeEach(() => {
    // Setup mocks and default state
  })

  describe('Feature Group', () => {
    it('should handle specific behavior correctly', async () => {
      // Arrange: Set up test data and mocks
      // Act: Perform user actions or call functions
      // Assert: Verify expected outcomes
    })
  })
})
```

### Error Testing
All critical paths include error scenarios:
- Network failures and retries
- Invalid user input
- Authentication failures
- Database errors
- Rate limiting

## Performance Testing

### Mock Performance
- All external API calls are mocked for consistent test speed
- Database operations use in-memory mocks
- Real-time subscriptions are simulated without network calls

### Parallel Execution
- Tests can run in parallel with Jest's default behavior
- Each test gets isolated mock state
- No shared state between test files

## Continuous Integration

### CI Configuration
```bash
# CI test command
npm run test:ci

# Includes:
# - No watch mode
# - Coverage reporting
# - Exit on completion
# - Fail on low coverage
```

### Coverage Reports
- HTML report generated in `coverage/` directory
- Console summary shows coverage percentages
- CI fails if coverage falls below thresholds

## Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` for async state changes
2. **Mock cleanup**: Ensure `jest.clearAllMocks()` in `beforeEach`
3. **DOM queries**: Use `screen.debug()` to inspect rendered output
4. **Timer mocks**: Use `jest.useFakeTimers()` for time-dependent tests

### Debug Commands
```bash
# Run specific test file
npm test -- use-auth.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should handle authentication"

# Debug mode with more verbose output
npm test -- --verbose
```

## Future Testing Plans

### Areas for Expansion
- [ ] Payment flow testing (requires Razorpay mock setup)
- [ ] Admin functionality testing
- [ ] Performance/load testing for swipe operations
- [ ] E2E testing with Playwright or Cypress
- [ ] Visual regression testing

### Test Database Setup
- Mock Supabase operations with realistic data
- Seed test data for consistent scenarios
- Transaction rollback for integration tests

## Maintenance

### Regular Tasks
- Review and update mock data to match schema changes
- Add tests for new features before implementation
- Maintain coverage above threshold levels
- Update test utilities as the app evolves

### Code Quality
- Tests are part of the codebase and follow the same quality standards
- TypeScript ensures type safety in tests
- ESLint rules apply to test files
- Tests should be reviewed in PRs

---

## Quick Start

To get started with testing:

1. **Install dependencies**: `npm install`
2. **Run tests**: `npm test`
3. **Check coverage**: `npm run test:coverage`
4. **Write new tests**: Follow the patterns in existing test files
5. **Mock external services**: Use the utilities in `test-utils.tsx`

The testing setup is designed to be comprehensive yet maintainable, providing confidence in the codebase while enabling rapid development and refactoring. 