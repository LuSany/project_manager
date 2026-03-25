'use client'

import { useState, useEffect } from 'react'

/**
 * Tailwind CSS 断点定义
 * 与 Tailwind 配置保持一致
 */
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

/**
 * useMediaQuery - 响应式断点检测 hook
 * @param breakpoint - 断点名称 (sm | md | lg | xl)
 * @returns boolean - 当前屏幕宽度是否 >= 断点值
 *
 * @example
 * const isMobile = !useMediaQuery('md') // < 768px
 * const isDesktop = useMediaQuery('lg') // >= 1024px
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`
    const media = window.matchMedia(query)

    // 初始化当前值
    setMatches(media.matches)

    // 监听变化
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [breakpoint])

  return matches
}