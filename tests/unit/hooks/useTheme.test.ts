/**
 * useTheme hook 测试
 * 测试主题状态读取、DOM class 切换、hydration 行为
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('useTheme', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
    // 清除模块缓存
    vi.resetModules()
    // 清除 document.documentElement 的 class
    document.documentElement.classList.remove('light', 'dark')
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.resetModules()
    document.documentElement.classList.remove('light', 'dark')
  })

  describe('return values', () => {
    it('should return current theme state', async () => {
      const { useTheme } = await import('@/hooks/useTheme')
      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('light')
    })

    it('should return setTheme and toggleTheme functions', async () => {
      const { useTheme } = await import('@/hooks/useTheme')
      const { result } = renderHook(() => useTheme())

      expect(typeof result.current.setTheme).toBe('function')
      expect(typeof result.current.toggleTheme).toBe('function')
    })

    it('should return hydrated state', async () => {
      const { useTheme } = await import('@/hooks/useTheme')
      const { result } = renderHook(() => useTheme())

      expect(typeof result.current.hydrated).toBe('boolean')
    })
  })

  describe('DOM class application', () => {
    it('should add "dark" class to document.documentElement when theme is dark', async () => {
      const { useTheme } = await import('@/hooks/useTheme')
      const { result } = renderHook(() => useTheme())

      // 等待 hydration 完成
      await vi.waitFor(() => {
        expect(result.current.hydrated).toBe(true)
      })

      // 设置主题为 dark
      act(() => {
        result.current.setTheme('dark')
      })

      // 检查 document.documentElement 是否有 dark class
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('should add "light" class to document.documentElement when theme is light', async () => {
      // 先设置为 dark
      localStorage.setItem('ui-storage', JSON.stringify({ state: { theme: 'dark' } }))

      const { useTheme } = await import('@/hooks/useTheme')
      const { result } = renderHook(() => useTheme())

      // 等待 hydration 完成
      await vi.waitFor(() => {
        expect(result.current.hydrated).toBe(true)
      })

      // 设置主题为 light
      act(() => {
        result.current.setTheme('light')
      })

      // 检查 document.documentElement 是否有 light class
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should not apply theme before hydration is complete', async () => {
      // 模拟 hydration 未完成的情况
      const { useUIStore } = await import('@/stores/uiStore')
      useUIStore.getState().setHydrated(false)

      const { useTheme } = await import('@/hooks/useTheme')
      renderHook(() => useTheme())

      // 在 hydration 完成前，不应应用任何主题 class
      expect(document.documentElement.classList.contains('light')).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('toggleTheme', () => {
    it('should toggle theme between light and dark', async () => {
      const { useTheme } = await import('@/hooks/useTheme')
      const { result } = renderHook(() => useTheme())

      // 等待 hydration
      await vi.waitFor(() => {
        expect(result.current.hydrated).toBe(true)
      })

      // 初始为 light
      expect(result.current.theme).toBe('light')

      // 切换为 dark
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // 切换为 light
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })
})