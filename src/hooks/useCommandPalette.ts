'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
  group?: string
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
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

  const defaultCommands: CommandItem[] = [
    {
      id: 'go-dashboard',
      title: '前往工作台',
      description: '查看仪表盘概览',
      action: () => router.push('/dashboard'),
      group: '导航',
    },
    {
      id: 'go-projects',
      title: '前往项目列表',
      description: '管理所有项目',
      action: () => router.push('/projects'),
      group: '导航',
    },
    {
      id: 'go-tasks',
      title: '前往任务列表',
      description: '查看我的任务',
      action: () => router.push('/tasks'),
      group: '导航',
    },
    {
      id: 'new-project',
      title: '创建新项目',
      description: '开始一个新项目',
      action: () => router.push('/projects/new'),
      group: '创建',
    },
    {
      id: 'new-task',
      title: '创建新任务',
      description: '添加一个新任务',
      action: () => router.push('/tasks/new'),
      group: '创建',
    },
    {
      id: 'go-settings',
      title: '打开设置',
      description: '个人偏好设置',
      action: () => router.push('/settings'),
      group: '设置',
    },
  ]

  return {
    open,
    setOpen,
    toggle,
    close,
    commands: defaultCommands,
  }
}
