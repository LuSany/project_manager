import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs'

const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('useBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array for root path', () => {
    mockUsePathname.mockReturnValue('/')
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([])
  })

  it('returns correct breadcrumbs for dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([{ label: '工作台', href: undefined }])
  })

  it('returns correct breadcrumbs for projects', () => {
    mockUsePathname.mockReturnValue('/projects')
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([{ label: '项目', href: undefined }])
  })

  it('returns correct breadcrumbs for nested path', () => {
    mockUsePathname.mockReturnValue('/projects/new')
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([
      { label: '项目', href: '/projects' },
      { label: '新建', href: undefined },
    ])
  })

  it('handles UUID in path as detail page', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    mockUsePathname.mockReturnValue(`/projects/${uuid}`)
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([
      { label: '项目', href: '/projects' },
      { label: '详情', href: `/projects/${uuid}` },
    ])
  })

  it('handles numeric ID in path', () => {
    mockUsePathname.mockReturnValue('/tasks/123')
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([
      { label: '任务', href: '/tasks' },
      { label: '详情', href: '/tasks/123' },
    ])
  })

  it('returns correct breadcrumbs for settings path', () => {
    mockUsePathname.mockReturnValue('/settings/profile')
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([
      { label: '设置', href: '/settings' },
      { label: '个人资料', href: undefined },
    ])
  })

  it('uses original segment as label when no mapping exists', () => {
    mockUsePathname.mockReturnValue('/unknown-path')
    const { result } = renderHook(() => useBreadcrumbs())
    expect(result.current).toEqual([{ label: 'unknown-path', href: undefined }])
  })
})
