import { POST } from '@/app/api/push/register/route'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

jest.mock('@supabase/auth-helpers-nextjs')
jest.mock('next/headers', () => ({ cookies: jest.fn() }))

const mockBuilder = () => ({
  upsert: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
})

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
  },
  from: jest.fn(() => mockBuilder()),
}

describe('/api/push/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createRouteHandlerClient as any).mockReturnValue(mockSupabase)
  })

  it('rejects unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await POST(new Request('http://localhost/api/push/register', { method: 'POST', body: JSON.stringify({ token: 'ExponentPushToken[abc]' }) }))
    expect(res.status).toBe(401)
  })

  it('validates token', async () => {
    const res = await POST(new Request('http://localhost/api/push/register', { method: 'POST', body: JSON.stringify({ token: 'bad' }) }))
    expect(res.status).toBe(422)
  })

  it('upserts valid token', async () => {
    const res = await POST(new Request('http://localhost/api/push/register', { method: 'POST', body: JSON.stringify({ token: 'ExponentPushToken[abc]', platform: 'android' }) }))
    expect(res.status).toBe(200)
  })
})


