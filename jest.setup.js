import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLoading: false,
      isPreview: false,
      isReady: true,
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

// Mock Supabase modules to prevent ES module import issues
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithOtp: jest.fn().mockResolvedValue({ data: null, error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ data: null, error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }),
    },
    from: jest.fn(() => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
      
      // Ensure every method returns the same object (the chain)
      Object.keys(mockQueryBuilder).forEach(key => {
        if (typeof mockQueryBuilder[key] === 'function' && key !== 'single' && key !== 'maybeSingle') {
          mockQueryBuilder[key].mockReturnValue(mockQueryBuilder)
        }
      })
      
      return mockQueryBuilder
    }),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue('SUBSCRIBED'),
      unsubscribe: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' },
        }),
      })),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }))
}))

// Mock the data service
jest.mock('@/lib/data-service', () => ({
  userService: {
    getCurrentProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
  messageService: {
    getMessages: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
  },
}))

// Mock @supabase/auth-helpers-nextjs to prevent ES module issues  
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }),
    },
  })),
  createServerComponentClient: jest.fn(),
  createRouteHandlerClient: jest.fn(),
}))

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, options) => {
      const status = options?.status || 200
      const headers = options?.headers || {}
      const response = {
        status,
        headers,
        json: () => Promise.resolve(body),
        ok: status >= 200 && status < 300,
        statusText: status === 200 ? 'OK' : status === 400 ? 'Bad Request' : status === 401 ? 'Unauthorized' : status === 404 ? 'Not Found' : status === 429 ? 'Too Many Requests' : 'Internal Server Error'
      }
      return response
    }),
    redirect: jest.fn(),
    rewrite: jest.fn(),
  },
  NextRequest: jest.fn(),
}))

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    time: jest.fn(),
    timeEnd: jest.fn(),
  },
}))

// Mock @/lib/supabase directly (this is what components actually import)
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithOtp: jest.fn().mockResolvedValue({ data: null, error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ data: null, error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }),
    },
    from: jest.fn(() => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
      
      // Ensure every method returns the same object (the chain)
      Object.keys(mockQueryBuilder).forEach(key => {
        if (typeof mockQueryBuilder[key] === 'function' && key !== 'single' && key !== 'maybeSingle') {
          mockQueryBuilder[key].mockReturnValue(mockQueryBuilder)
        }
      })
      
      return mockQueryBuilder
    }),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue('SUBSCRIBED'),
      unsubscribe: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  },
}))

// Global mocks that don't require module resolution will be set up here
// Specific module mocks will be done in individual test files

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    img: 'img',
    form: 'form',
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Also set global localStorage for tests that access it directly
global.localStorage = localStorageMock

// Global test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.RAZORPAY_KEY_ID = 'test-razorpay-key'
process.env.RAZORPAY_KEY_SECRET = 'test-razorpay-secret'
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test-razorpay-key' 