import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCommandPalette } from '@/hooks/useCommandPalette'

const mockPush = vi.fn()
const mockUseRouter = vi.fn(() => ({ push: mockPush }))

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}))

describe('useCommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with closed state', () => {
    const { result } = renderHook(() => useCommandPalette())
    expect(result.current.open).toBe(false)
  })

  it('toggles open state', () => {
    const { result } = renderHook(() => useCommandPalette())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.open).toBe(true)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.open).toBe(false)
  })

  it('closes the palette', () => {
    const { result } = renderHook(() => useCommandPalette())

    act(() => {
      result.current.toggle()
    })
    expect(result.current.open).toBe(true)

    act(() => {
      result.current.close()
    })
    expect(result.current.open).toBe(false)
  })

  it('provides default commands', () => {
    const { result } = renderHook(() => useCommandPalette())
    expect(result.current.commands.length).toBeGreaterThan(0)
  })

  it('includes navigation commands', () => {
    const { result } = renderHook(() => useCommandPalette())
    const navCommands = result.current.commands.filter((c) => c.group === '导航')
    expect(navCommands.length).toBeGreaterThan(0)
  })

  it('includes create commands', () => {
    const { result } = renderHook(() => useCommandPalette())
    const createCommands = result.current.commands.filter((c) => c.group === '创建')
    expect(createCommands.length).toBeGreaterThan(0)
  })

  it('navigates to dashboard when command action is called', () => {
    const { result } = renderHook(() => useCommandPalette())

    const dashboardCommand = result.current.commands.find((c) => c.id === 'go-dashboard')
    expect(dashboardCommand).toBeDefined()

    act(() => {
      dashboardCommand?.action()
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('navigates to new project when command action is called', () => {
    const { result } = renderHook(() => useCommandPalette())

    const newProjectCommand = result.current.commands.find((c) => c.id === 'new-project')
    expect(newProjectCommand).toBeDefined()

    act(() => {
      newProjectCommand?.action()
    })

    expect(mockPush).toHaveBeenCalledWith('/projects/new')
  })

  // Task 2: 最近访问功能测试
  describe('recent visits', () => {
    it('returns recentVisits array', () => {
      const { result } = renderHook(() => useCommandPalette())
      expect(result.current.recentVisits).toBeDefined()
      expect(Array.isArray(result.current.recentVisits)).toBe(true)
    })

    it('addRecentVisit adds new record and limits to 8 items', () => {
      const { result } = renderHook(() => useCommandPalette())

      // 添加 10 条记录
      for (let i = 1; i <= 10; i++) {
        act(() => {
          result.current.addRecentVisit({
            title: `项目 ${i}`,
            path: `/projects/${i}`,
          })
        })
      }

      // 验证最多保留 8 条
      expect(result.current.recentVisits.length).toBe(8)

      // 验证最新的在前面
      expect(result.current.recentVisits[0].title).toBe('项目 10')
      expect(result.current.recentVisits[7].title).toBe('项目 3')
    })

    it('addRecentVisit removes duplicate paths', () => {
      const { result } = renderHook(() => useCommandPalette())

      act(() => {
        result.current.addRecentVisit({ title: '项目 A', path: '/projects/a' })
      })
      act(() => {
        result.current.addRecentVisit({ title: '项目 B', path: '/projects/b' })
      })
      act(() => {
        result.current.addRecentVisit({ title: '项目 A (更新)', path: '/projects/a' })
      })

      expect(result.current.recentVisits.length).toBe(2)
      expect(result.current.recentVisits[0].title).toBe('项目 A (更新)')
    })

    it('commands include recent visits group', () => {
      const { result } = renderHook(() => useCommandPalette())

      act(() => {
        result.current.addRecentVisit({ title: '测试项目', path: '/projects/test' })
      })

      const recentCommands = result.current.commands.filter((c) => c.group === '最近访问')
      expect(recentCommands.length).toBeGreaterThan(0)
    })
  })

  // Task 2: 收藏功能测试
  describe('favorites', () => {
    it('returns favorites array', () => {
      const { result } = renderHook(() => useCommandPalette())
      expect(result.current.favorites).toBeDefined()
      expect(Array.isArray(result.current.favorites)).toBe(true)
    })

    it('toggleFavorite adds item to favorites', () => {
      const { result } = renderHook(() => useCommandPalette())

      act(() => {
        result.current.toggleFavorite({
          id: 'proj-1',
          title: '我的项目',
          path: '/projects/1',
          type: 'project',
        })
      })

      expect(result.current.favorites.length).toBe(1)
      expect(result.current.favorites[0].title).toBe('我的项目')
    })

    it('toggleFavorite removes item from favorites', () => {
      const { result } = renderHook(() => useCommandPalette())

      act(() => {
        result.current.toggleFavorite({
          id: 'proj-1',
          title: '我的项目',
          path: '/projects/1',
          type: 'project',
        })
      })
      expect(result.current.favorites.length).toBe(1)

      act(() => {
        result.current.toggleFavorite({
          id: 'proj-1',
          title: '我的项目',
          path: '/projects/1',
          type: 'project',
        })
      })
      expect(result.current.favorites.length).toBe(0)
    })

    it('commands include favorites group when favorites exist', () => {
      const { result } = renderHook(() => useCommandPalette())

      act(() => {
        result.current.toggleFavorite({
          id: 'proj-1',
          title: '收藏项目',
          path: '/projects/1',
          type: 'project',
        })
      })

      const favoriteCommands = result.current.commands.filter((c) => c.group === '收藏项目')
      expect(favoriteCommands.length).toBe(1)
    })
  })

  // Task 2: 快捷操作和 AI 助手分组测试
  describe('enhanced command groups', () => {
    it('includes quick actions group', () => {
      const { result } = renderHook(() => useCommandPalette())
      const quickCommands = result.current.commands.filter((c) => c.group === '快捷操作')
      expect(quickCommands.length).toBeGreaterThan(0)
    })

    it('includes AI assistant group', () => {
      const { result } = renderHook(() => useCommandPalette())
      const aiCommands = result.current.commands.filter((c) => c.group === 'AI 助手')
      expect(aiCommands.length).toBeGreaterThan(0)
    })
  })
})
