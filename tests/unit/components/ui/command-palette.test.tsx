import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommandPalette } from '@/components/ui/command-palette'

// Mock ResizeObserver for cmdk
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/hooks/useCommandPalette', () => ({
  useCommandPalette: () => ({
    open: true,
    close: vi.fn(),
    toggle: vi.fn(),
    commands: [
      { id: 'fav-1', title: '收藏项目1', action: vi.fn(), group: '收藏项目', type: 'favorite' },
      { id: 'recent-1', title: '最近访问1', action: vi.fn(), group: '最近访问', type: 'recent' },
      { id: 'quick-1', title: '快捷操作1', action: vi.fn(), group: '快捷操作', type: 'action' },
      { id: 'ai-1', title: 'AI 助手入口', action: vi.fn(), group: 'AI 助手', type: 'ai' },
      { id: 'nav-1', title: '导航命令1', action: vi.fn(), group: '导航', type: 'navigation' },
    ],
    recentVisits: [],
    addRecentVisit: vi.fn(),
    favorites: [],
    toggleFavorite: vi.fn(),
  }),
}))

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders command palette when open', () => {
    render(<CommandPalette />)
    expect(screen.getByPlaceholderText('搜索命令或页面...')).toBeInTheDocument()
  })

  it('shows favorite commands', () => {
    render(<CommandPalette />)
    // Use getAllByText since text may appear in group heading too
    const elements = screen.getAllByText('收藏项目1')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('shows recent visit commands', () => {
    render(<CommandPalette />)
    const elements = screen.getAllByText('最近访问1')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('shows quick action commands', () => {
    render(<CommandPalette />)
    const elements = screen.getAllByText('快捷操作1')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('shows AI assistant command', () => {
    render(<CommandPalette />)
    const elements = screen.getAllByText('AI 助手入口')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('shows navigation commands', () => {
    render(<CommandPalette />)
    const elements = screen.getAllByText('导航命令1')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('shows keyboard shortcuts hint', () => {
    render(<CommandPalette />)
    // Use getAllByText since multiple instances may be rendered
    const selectElements = screen.getAllByText(/选择/)
    const confirmElements = screen.getAllByText(/确认/)
    expect(selectElements.length).toBeGreaterThan(0)
    expect(confirmElements.length).toBeGreaterThan(0)
  })

  it('shows Cmd+K hint', () => {
    render(<CommandPalette />)
    const cmdElements = screen.getAllByText(/⌘K/)
    expect(cmdElements.length).toBeGreaterThan(0)
  })

  it('displays groups with correct headings', () => {
    render(<CommandPalette />)
    // Check that group headings exist by looking for text content
    // The cmdk library renders multiple virtual copies, so we just verify the text exists
    expect(screen.getAllByText('收藏项目').length).toBeGreaterThan(0)
    expect(screen.getAllByText('最近访问').length).toBeGreaterThan(0)
    expect(screen.getAllByText('快捷操作').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI 助手').length).toBeGreaterThan(0)
    expect(screen.getAllByText('导航').length).toBeGreaterThan(0)
  })
})