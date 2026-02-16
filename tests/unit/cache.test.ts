import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    notificationIgnore: {
      findUnique: vi.fn(),
    },
  },
}))

import { cache, cached } from '@/lib/cache'

describe('缓存模块', () => {
  beforeEach(() => {
    cache.clear()
  })

  describe('cache.set & cache.get', () => {
    it('应该正确设置和获取缓存', () => {
      cache.set('test-key', { name: 'test' })
      const result = cache.get('test-key')
      expect(result).toEqual({ name: 'test' })
    })

    it('不存在的key应返回null', () => {
      const result = cache.get('non-exist')
      expect(result).toBeNull()
    })

    it('应该支持TTL过期', async () => {
      cache.set('expire-key', 'value', 100)
      const result = cache.get('expire-key')
      expect(result).toBe('value')

      await new Promise((resolve) => setTimeout(resolve, 150))
      const expiredResult = cache.get('expire-key')
      expect(expiredResult).toBeNull()
    })
  })

  describe('cache.has', () => {
    it('存在的key应返回true', () => {
      cache.set('key1', 'value')
      expect(cache.has('key1')).toBe(true)
    })

    it('不存在的key应返回false', () => {
      expect(cache.has('non-exist')).toBe(false)
    })
  })

  describe('cache.delete', () => {
    it('应该正确删除缓存', () => {
      cache.set('key1', 'value')
      cache.delete('key1')
      expect(cache.get('key1')).toBeNull()
    })
  })

  describe('缓存标签', () => {
    it('应该支持标签功能', () => {
      cache.set('key1', 'value1', 60000, ['tag1'])
      cache.set('key2', 'value2', 60000, ['tag1', 'tag2'])

      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
    })

    it('应该支持按标签失效', () => {
      cache.set('key1', 'value1', 60000, ['tag1'])
      cache.set('key2', 'value2', 60000, ['tag1'])
      cache.set('key3', 'value3', 60000, ['tag2'])

      const count = cache.invalidateByTag('tag1')
      expect(count).toBe(2)
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key3')).toBe('value3')
    })
  })

  describe('cache.getStats', () => {
    it('应该返回正确的统计数据', () => {
      cache.set('key1', 'value1')
      cache.get('key1')
      cache.get('non-exist')

      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(0.5)
    })
  })

  describe('cached 包装函数', () => {
    it('缓存未命中时应执行函数并缓存结果', async () => {
      const mockFn = vi.fn().mockResolvedValue('computed')

      const result = await cached('cached-key', mockFn)
      expect(result).toBe('computed')
      expect(mockFn).toHaveBeenCalledTimes(1)

      const cachedResult = await cached('cached-key', mockFn)
      expect(cachedResult).toBe('computed')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
