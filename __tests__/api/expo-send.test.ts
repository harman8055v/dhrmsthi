import { POST } from '@/app/api/expo/send/route'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/auth-helpers-nextjs')
jest.mock('@supabase/supabase-js')
jest.mock('next/headers', () => ({ cookies: jest.fn() }))

describe('/api/expo/send', () => {
  const mockAdmin = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{ token: 'ExponentPushToken[abc]' }], error: null }),
      delete: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockAdmin)
    ;(createRouteHandlerClient as any).mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    })
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: [{ status: 'ok' }] }) })) as any
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://example'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
  })

  it('rejects when required fields missing', async () => {
    const res = await POST(new Request('http://localhost/api/expo/send', { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('sends to Expo and returns response', async () => {
    const res = await POST(new Request('http://localhost/api/expo/send', { method: 'POST', body: JSON.stringify({ userId: 'u2', title: 't', body: 'b' }) }))
    expect(res.status).toBe(200)
    expect(global.fetch).toHaveBeenCalled()
  })
})


