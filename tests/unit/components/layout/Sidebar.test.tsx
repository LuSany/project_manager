import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'

// Mock localStorage
const localStorageMock = {
  clear: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock uiStore
vi.mock('@/stores/uiStore', () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      sidebarCollapsed: false,
      toggleSidebar: vi.fn(),
      _hydrated: true,
    }
    return selector(state)
  }),
}))

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
    localStorageMock.clear.mockClear()
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

  describe('我的任务动态徽章', () => {
    it('从 API 获取任务数并显示徽章', async () => {
      ;(global.fetch as vi.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/v1/dashboard/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { myTasksCount: 7 },
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { role: 'USER' } }),
        })
      })

      render(<Sidebar />)

      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument()
      })
    })

    it('任务数为 0 时隐藏徽章', async () => {
      ;(global.fetch as vi.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/v1/dashboard/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { myTasksCount: 0 },
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { role: 'USER' } }),
        })
      })

      render(<Sidebar />)

      await waitFor(() => {
        expect(screen.queryByText('0')).not.toBeInTheDocument()
      })
    })

    it('任务数超过 99 显示 99+', async () => {
      ;(global.fetch as vi.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/v1/dashboard/stats')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { myTasksCount: 150 },
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { role: 'USER' } }),
        })
      })

      render(<Sidebar />)

      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument()
      })
    })
  })
})
