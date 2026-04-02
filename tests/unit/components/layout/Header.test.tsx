import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { Header } from '@/components/layout/Header'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode
    href: string
    onClick?: () => void
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'EMPLOYEE',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}))

// Mock useBreadcrumbs hook
vi.mock('@/hooks/useBreadcrumbs', () => ({
  useBreadcrumbs: () => [{ label: '工作台', href: '/dashboard' }],
}))

// Mock useMediaQuery hook - 默认返回 true (桌面端)
let mockIsDesktop = true
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn((_breakpoint: 'sm' | 'md' | 'lg' | 'xl') => mockIsDesktop),
}))

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDesktop = true // 默认桌面端
  })

  afterEach(() => {
    cleanup()
  })

  describe('桌面端布局', () => {
    it('显示面包屑导航', () => {
      render(<Header />)

      // 桌面端显示面包屑
      expect(screen.getByText('工作台')).toBeInTheDocument()
    })

    it('显示搜索框', () => {
      render(<Header />)

      // 搜索框存在
      const searchInput = screen.getByPlaceholderText('搜索项目、任务、需求...')
      expect(searchInput).toBeInTheDocument()
    })

    it('显示通知图标', () => {
      render(<Header />)

      // 通知链接存在 - 通过 href 查找
      const notificationLinks = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href') === '/notifications')
      expect(notificationLinks.length).toBeGreaterThan(0)
    })

    it('显示用户菜单', () => {
      render(<Header />)

      // 用户名显示
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  describe('移动端布局', () => {
    beforeEach(() => {
      mockIsDesktop = false // 移动端
    })

    it('显示汉堡菜单', () => {
      render(<Header />)

      // 移动端显示汉堡菜单按钮
      const menuButton = screen.getAllByRole('button', { name: /打开导航菜单/i })
      expect(menuButton.length).toBeGreaterThan(0)
    })

    it('隐藏搜索框', () => {
      render(<Header />)

      // 移动端不显示搜索框
      expect(screen.queryByPlaceholderText('搜索项目、任务、需求...')).not.toBeInTheDocument()
    })

    it('隐藏用户名，仅显示头像', () => {
      render(<Header />)

      // 移动端不显示用户名
      expect(screen.queryByText('Test User')).not.toBeInTheDocument()
    })
  })

  describe('组件结构', () => {
    it('Header 固定在顶部', () => {
      render(<Header />)

      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky')
      expect(header).toHaveClass('top-0')
    })
  })

  describe('通知徽章', () => {
    beforeEach(() => {
      mockIsDesktop = true
    })

    it('有未读通知时显示徽章', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                { id: '1', title: '通知1' },
                { id: '2', title: '通知2' },
                { id: '3', title: '通知3' },
              ],
            }),
        })
      )
      global.fetch = mockFetch as any

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('无未读通知时隐藏徽章', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: [],
            }),
        })
      )
      global.fetch = mockFetch as any

      render(<Header />)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('未读通知超过 9 个显示 9+', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: Array.from({ length: 15 }, (_, i) => ({ id: String(i), title: `通知${i}` })),
            }),
        })
      )
      global.fetch = mockFetch as any

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('9+')).toBeInTheDocument()
      })
    })
  })
})
