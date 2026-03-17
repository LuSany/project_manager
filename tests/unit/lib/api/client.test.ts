import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient, ApiError } from '@/lib/api/client'

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should include credentials: include in all requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', mockFetch)

    await ApiClient.get('/test')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('should return error response on non-ok status', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    )
    vi.stubGlobal('fetch', mockFetch)

    const result = await ApiClient.get('/test')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('UNAUTHORIZED')
  })

  it('should handle network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network failed'))
    vi.stubGlobal('fetch', mockFetch)

    const result = await ApiClient.get('/test')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('NETWORK_ERROR')
    expect(result.error?.message).toBe('Network failed')
  })

  it('should handle non-JSON responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('<html>Error</html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })
    )
    vi.stubGlobal('fetch', mockFetch)

    const result = await ApiClient.get('/test')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('INVALID_RESPONSE')
  })
})

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError(401, 'UNAUTHORIZED', '请先登录', { userId: '123' })

    expect(error.status).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.message).toBe('请先登录')
    expect(error.data).toEqual({ userId: '123' })
    expect(error.name).toBe('ApiError')
  })
})
