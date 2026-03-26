/**
 * useTheme Hook
 * 主题切换 hook - 封装 uiStore 主题状态，处理 DOM class 切换
 */

'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

/**
 * useTheme hook
 * 提供主题状态和切换功能，自动应用到 document.documentElement
 */
export function useTheme() {
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const _hydrated = useUIStore((state) => state._hydrated)

  // 应用主题到 DOM
  useEffect(() => {
    if (!_hydrated) return

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme, _hydrated])

  return { theme, setTheme, toggleTheme, hydrated: _hydrated }
}