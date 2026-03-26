import * as React from 'react'

/**
 * 命令项类型
 */
export interface CommandItem {
  /** 唯一标识 */
  id: string
  /** 显示标题 */
  title: string
  /** 描述文字 */
  description?: string
  /** 图标组件 */
  icon?: React.ComponentType<{ className?: string }>
  /** 快捷键提示 */
  shortcut?: string
  /** 点击回调 */
  action: () => void
  /** 分组名称 */
  group?: string
  /** 命令类型 */
  type?: 'navigation' | 'action' | 'recent' | 'favorite' | 'ai'
  /** 时间戳 (用于最近访问排序) */
  timestamp?: number
  /** 是否收藏 */
  isFavorite?: boolean
}

/**
 * 最近访问记录
 */
export interface RecentVisit {
  id: string
  title: string
  path: string
  timestamp: number
}

/**
 * 收藏项
 */
export interface FavoriteItem {
  id: string
  title: string
  path: string
  type: 'project' | 'task' | 'requirement' | 'page'
  order: number
}

/**
 * 命令面板状态
 */
export interface CommandPaletteState {
  recentVisits: RecentVisit[]
  favorites: FavoriteItem[]
}