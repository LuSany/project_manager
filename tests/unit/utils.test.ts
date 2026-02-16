import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('工具函数模块', () => {
  describe('cn - 类名拼接', () => {
    it('应该拼接基础类名', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('应该过滤 falsy 值', () => {
      const result = cn('foo', false && 'bar', null, undefined, 0, 'baz')
      expect(result).toBe('foo baz')
    })

    it('应该处理条件类名', () => {
      const result = cn('foo', true && 'bar', false && 'baz')
      expect(result).toBe('foo bar')
    })

    it('应该合并对象类名', () => {
      const result = cn('foo', { bar: true, baz: false })
      expect(result).toBe('foo bar')
    })

    it('应该处理数组输入', () => {
      const result = cn(['foo', 'bar'])
      expect(result).toBe('foo bar')
    })

    it('应该处理复杂组合', () => {
      const result = cn('base', ['foo', 'bar'], { active: true, disabled: false })
      expect(result).toContain('base')
      expect(result).toContain('foo')
      expect(result).toContain('bar')
      expect(result).toContain('active')
    })
  })
})
