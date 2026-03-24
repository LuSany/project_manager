import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})
