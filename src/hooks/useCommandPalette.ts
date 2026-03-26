'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { CommandItem, RecentVisit, FavoriteItem } from '@/types/command'

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([])
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const router = useRouter()

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && open) {
        close()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle, close, open])

  // 添加最近访问记录
  const addRecentVisit = useCallback((visit: Omit<RecentVisit, 'id' | 'timestamp'>) => {
    const newVisit: RecentVisit = {
      id: `recent-${Date.now()}`,
      title: visit.title,
      path: visit.path,
      timestamp: Date.now(),
    }
    setRecentVisits((prev) => {
      // 去重：移除相同 path 的旧记录
      const filtered = prev.filter((v) => v.path !== visit.path)
      // 限制最多 8 条
      const updated = [newVisit, ...filtered].slice(0, 8)
      return updated
    })
  }, [])

  // 切换收藏状态
  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'order'>) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === item.id)
      if (exists) {
        return prev.filter((f) => f.id !== item.id)
      }
      const newFavorite: FavoriteItem = {
        ...item,
        order: prev.length,
      }
      return [...prev, newFavorite]
    })
  }, [])

  // 构建命令列表
  const commands = useMemo(() => {
    const cmds: CommandItem[] = []

    // 收藏项目分组
    favorites.slice(0, 5).forEach((fav) => {
      cmds.push({
        id: `fav-${fav.id}`,
        title: fav.title,
        action: () => router.push(fav.path),
        group: '收藏项目',
        type: 'favorite',
        isFavorite: true,
      })
    })

    // 最近访问分组
    recentVisits.slice(0, 8).forEach((visit) => {
      cmds.push({
        id: `recent-${visit.id}`,
        title: visit.title,
        action: () => router.push(visit.path),
        group: '最近访问',
        type: 'recent',
        timestamp: visit.timestamp,
      })
    })

    // 快捷操作分组
    cmds.push(
      {
        id: 'quick-new-task',
        title: '创建新任务',
        description: '快速创建任务',
        action: () => router.push('/tasks/new'),
        group: '快捷操作',
        type: 'action',
        shortcut: 'T',
      },
      {
        id: 'quick-new-project',
        title: '创建新项目',
        description: '开始一个新项目',
        action: () => router.push('/projects/new'),
        group: '快捷操作',
        type: 'action',
        shortcut: 'P',
      }
    )

    // AI 助手分组
    cmds.push({
      id: 'ai-assistant',
      title: 'AI 助手',
      description: '与 AI 对话获取帮助',
      action: () => router.push('/ai'),
      group: 'AI 助手',
      type: 'ai',
    })

    // 导航命令
    cmds.push(
      {
        id: 'go-dashboard',
        title: '前往工作台',
        description: '查看仪表盘概览',
        action: () => router.push('/dashboard'),
        group: '导航',
        type: 'navigation',
      },
      {
        id: 'go-projects',
        title: '前往项目列表',
        description: '管理所有项目',
        action: () => router.push('/projects'),
        group: '导航',
        type: 'navigation',
      },
      {
        id: 'go-tasks',
        title: '前往任务列表',
        description: '查看我的任务',
        action: () => router.push('/tasks'),
        group: '导航',
        type: 'navigation',
      }
    )

    // 创建命令
    cmds.push(
      {
        id: 'new-project',
        title: '创建新项目',
        description: '开始一个新项目',
        action: () => router.push('/projects/new'),
        group: '创建',
        type: 'action',
      },
      {
        id: 'new-task',
        title: '创建新任务',
        description: '添加一个新任务',
        action: () => router.push('/tasks/new'),
        group: '创建',
        type: 'action',
      }
    )

    // 设置命令
    cmds.push({
      id: 'go-settings',
      title: '打开设置',
      description: '个人偏好设置',
      action: () => router.push('/settings'),
      group: '设置',
      type: 'navigation',
    })

    return cmds
  }, [recentVisits, favorites, router])

  return {
    open,
    setOpen,
    toggle,
    close,
    commands,
    recentVisits,
    addRecentVisit,
    favorites,
    toggleFavorite,
  }
}