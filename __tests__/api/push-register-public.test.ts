import { POST } from '@/app/api/push/register-public/route'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js')

describe('/api/push/register-public', () => {
  const mockAdmin = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null }),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockAdmin)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://example'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
  })

  it('validates inputs', async () => {
    const res = await POST(new Request('http://localhost/api/push/register-public', { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('rejects invalid token', async () => {
    const res = await POST(new Request('http://localhost/api/push/register-public', { method: 'POST', body: JSON.stringify({ token: 'bad', userId: '4df0f120-2b5c-4e40-a7f4-df579bcbe111' }) }))
    expect(res.status).toBe(422)
  })

  it('rejects invalid userId', async () => {
    const res = await POST(new Request('http://localhost/api/push/register-public', { method: 'POST', body: JSON.stringify({ token: 'ExponentPushToken[abc]', userId: 'not-a-uuid' }) }))
    expect(res.status).toBe(422)
  })

  it('succeeds', async () => {
    const res = await POST(new Request('http://localhost/api/push/register-public', { method: 'POST', body: JSON.stringify({ token: 'ExponentPushToken[abc]', userId: '4df0f120-2b5c-4e40-a7f4-df579bcbe111', platform: 'android' }) }))
    expect(res.status).toBe(200)
  })
})


