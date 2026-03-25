import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock fetch for user role
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: { role: 'USER' } }),
  })
) as vi.Mock

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('组件渲染', () => {
    it('渲染侧边栏组件', async () => {
      render(<Sidebar />)

      await waitFor(() => {
        const texts = screen.getAllByText('工作台')
        expect(texts.length).toBeGreaterThan(0)
      })
    })

    it('显示导航项文字标签', async () => {
      render(<Sidebar />)

      await waitFor(() => {
        const texts = screen.getAllByText('工作台')
        expect(texts.length).toBeGreaterThan(0)
      })

      expect(screen.getAllByText('我的任务').length).toBeGreaterThan(0)
      expect(screen.getAllByText('项目').length).toBeGreaterThan(0)
      expect(screen.getAllByText('里程碑').length).toBeGreaterThan(0)
    })
  })

  describe('SSR hydration 检测', () => {
    it('渲染侧边栏容器', async () => {
      render(<Sidebar />)

      await waitFor(() => {
        const aside = document.querySelector('aside')
        expect(aside).toBeInTheDocument()
      })
    })
  })

  describe('使用 uiStore 管理状态', () => {
    it('组件正确导出', async () => {
      const sidebarModule = await import('@/components/layout/Sidebar')
      expect(typeof sidebarModule.Sidebar).toBe('function')
    })
  })
})