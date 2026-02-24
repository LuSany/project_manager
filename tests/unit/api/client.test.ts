import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()

vi.mocked(fetch).mockImplementation(
  () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    }) as Promise<Response>
)

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该导出 ApiClient 类', async () => {
    const { ApiClient } = await import('@/lib/api/client')
    expect(ApiClient).toBeDefined()
    expect(typeof ApiClient).toBe('function')
  })

  it('应该导出 api 对象', async () => {
    const { api } = await import('@/lib/api/client')
    expect(api).toBeDefined()
    expect(typeof api).toBe('object')
    expect(api.get).toBeDefined()
    expect(api.post).toBeDefined()
    expect(api.put).toBeDefined()
    expect(api.delete).toBeDefined()
  })

  it('get 方法应该发送 GET 请求', async () => {
    const { ApiClient } = await import('@/lib/api/client')
    await ApiClient.get('/test')
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })

  it('get 方法应该支持查询参数', async () => {
    const { ApiClient } = await import('@/lib/api/client')
    await ApiClient.get('/test', { page: 1, pageSize: 10 })
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/test?page=1&pageSize=10',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })

  it('post 方法应该发送 POST 请求', async () => {
    const { ApiClient } = await import('@/lib/api/client')
    await ApiClient.post('/test', { name: 'test' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })
    )
  })

  it('put 方法应该发送 PUT 请求', async () => {
    const { ApiClient } = await import('@/lib/api/client')
    await ApiClient.put('/test/1', { name: 'updated' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/test/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'updated' }),
      })
    )
  })

  it('delete 方法应该发送 DELETE 请求', async () => {
    const { ApiClient } = await import('@/lib/api/client')
    await ApiClient.delete('/test/1')
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/test/1',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('api.get 便捷方法应该正常工作', async () => {
    const { api } = await import('@/lib/api/client')
    await api.get('/test')
    expect(fetch).toHaveBeenCalled()
  })

  it('api.post 便捷方法应该正常工作', async () => {
    const { api } = await import('@/lib/api/client')
    await api.post('/test', { data: 'test' })
    expect(fetch).toHaveBeenCalled()
  })

  it('api.put 便捷方法应该正常工作', async () => {
    const { api } = await import('@/lib/api/client')
    await api.put('/test/1', { data: 'test' })
    expect(fetch).toHaveBeenCalled()
  })

  it('api.delete 便捷方法应该正常工作', async () => {
    const { api } = await import('@/lib/api/client')
    await api.delete('/test/1')
    expect(fetch).toHaveBeenCalled()
  })
})
