import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MobileNav } from '@/components/layout/MobileNav'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'USER' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}))

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('组件渲染', () => {
    it('渲染汉堡菜单按钮', () => {
      render(<MobileNav />)

      // 查找汉堡菜单按钮 (通过 aria-label)
      const menuButtons = screen.getAllByRole('button', { name: /打开导航菜单/i })
      expect(menuButtons.length).toBeGreaterThan(0)
    })

    it('Sheet 默认关闭状态', () => {
      render(<MobileNav />)

      // Sheet 内容不应显示
      expect(screen.queryByText('项目管理')).not.toBeInTheDocument()
    })
  })

  describe('Sheet 导航列表', () => {
    it('点击汉堡菜单打开 Sheet，显示导航列表', async () => {
      render(<MobileNav />)

      // 点击汉堡菜单
      const menuButton = screen.getAllByRole('button', { name: /打开导航菜单/i })[0]
      fireEvent.click(menuButton)

      // Sheet 打开后显示标题
      await waitFor(() => {
        expect(screen.getByText('项目管理')).toBeInTheDocument()
      })

      // 显示导航项
      expect(screen.getByText('工作台')).toBeInTheDocument()
      expect(screen.getByText('我的任务')).toBeInTheDocument()
      expect(screen.getByText('项目')).toBeInTheDocument()
    })

    it('点击导航项后 Sheet 关闭', async () => {
      render(<MobileNav />)

      // 打开 Sheet
      const menuButton = screen.getAllByRole('button', { name: /打开导航菜单/i })[0]
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('工作台')).toBeInTheDocument()
      })

      // 点击导航项
      const dashboardLink = screen.getByText('工作台')
      fireEvent.click(dashboardLink)

      // Sheet 应该关闭
      await waitFor(() => {
        expect(screen.queryByText('项目管理')).not.toBeInTheDocument()
      })
    })
  })

  describe('adminOnly 导航项', () => {
    it('普通用户不显示 adminOnly 导航项', async () => {
      render(<MobileNav />)

      // 打开 Sheet
      const menuButton = screen.getAllByRole('button', { name: /打开导航菜单/i })[0]
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('工作台')).toBeInTheDocument()
      })

      // 普通用户不应看到用户管理
      expect(screen.queryByText('用户管理')).not.toBeInTheDocument()
    })
  })

  describe('active 导航项高亮', () => {
    it('当前路径对应的导航项存在且可点击', async () => {
      render(<MobileNav />)

      // 打开 Sheet
      const menuButton = screen.getAllByRole('button', { name: /打开导航菜单/i })[0]
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('工作台')).toBeInTheDocument()
      })

      // 工作台导航项存在 (当前路径 /dashboard)
      const dashboardLink = screen.getByRole('link', { name: /工作台/ })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('组件导出', () => {
    it('正确导出 MobileNav 组件', async () => {
      const mobileNavModule = await import('@/components/layout/MobileNav')
      expect(typeof mobileNavModule.MobileNav).toBe('function')
    })
  })
})