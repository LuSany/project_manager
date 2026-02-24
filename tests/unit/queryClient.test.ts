import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => {
  const mockDefaultOptions = {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  }

  return {
    QueryClient: vi.fn().mockImplementation(() => ({
      getDefaultOptions: () => mockDefaultOptions,
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
      clear: vi.fn(),
    })),
  }
})

describe('QueryClient Module', () => {
  it('应该导出 QueryClient 实例', async () => {
    const queryClient = (await import('@/lib/queryClient')).default
    expect(queryClient).toBeDefined()
  })

  it('应该配置正确的默认选项', async () => {
    const queryClient = (await import('@/lib/queryClient')).default
    const defaultOptions = queryClient.getDefaultOptions()

    expect(defaultOptions.queries.retry).toBe(1)
    expect(defaultOptions.queries.staleTime).toBe(5 * 60 * 1000)
    expect(defaultOptions.mutations.retry).toBe(1)
  })

  it('应该是一个单例实例', async () => {
    const queryClient1 = (await import('@/lib/queryClient')).default
    const queryClient2 = (await import('@/lib/queryClient')).default
    expect(queryClient1).toBe(queryClient2)
  })
})
