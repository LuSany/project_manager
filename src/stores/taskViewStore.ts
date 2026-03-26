/**
 * Task View Store
 * 任务视图状态管理 - 基于 Zustand + persist 中间件
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SortingState } from '@tanstack/react-table'

// ============================================================================
// 类型定义
// ============================================================================

/** 视图模式类型 */
export type TaskViewMode = 'list' | 'kanban'

/** 分组维度类型 */
export type GroupByOption = 'status' | 'priority' | 'assignee' | null

/** 筛选条件 */
export interface FilterCondition {
  /** 筛选字段 */
  field: string
  /** 筛选操作符 */
  operator: string
  /** 筛选值 */
  value: string
}

// ============================================================================
// State 接口
// ============================================================================

interface TaskViewState {
  /** 视图模式：列表 / 看板 */
  viewMode: TaskViewMode
  /** 分组维度 */
  groupBy: GroupByOption
  /** 筛选条件列表 */
  filters: FilterCondition[]
  /** 排序规则 */
  sorting: SortingState
  /** hydration 状态标记 */
  _hydrated: boolean
}

// ============================================================================
// Actions 接口
// ============================================================================

interface TaskViewActions {
  /** 设置视图模式 */
  setViewMode: (mode: TaskViewMode) => void
  /** 设置分组维度 */
  setGroupBy: (group: GroupByOption) => void
  /** 添加筛选条件 */
  addFilter: (filter: FilterCondition) => void
  /** 移除筛选条件 */
  removeFilter: (field: string) => void
  /** 清除所有筛选条件 */
  clearFilters: () => void
  /** 设置排序规则 */
  setSorting: (sorting: SortingState) => void
  /** 设置 hydration 状态 */
  setHydrated: (state: boolean) => void
}

// ============================================================================
// Store 实现
// ============================================================================

/**
 * Task View Store
 * 使用 persist 中间件持久化 viewMode 和 groupBy 到 localStorage
 * filters 不持久化（每次进入页面重置）
 */
export const useTaskViewStore = create<TaskViewState & TaskViewActions>()(
  persist(
    (set) => ({
      // 默认状态
      viewMode: 'list',
      groupBy: null,
      filters: [],
      sorting: [
        { id: 'priority', desc: true },
        { id: 'dueDate', desc: false },
      ],
      _hydrated: false,

      // Actions
      setViewMode: (mode) => set({ viewMode: mode }),

      setGroupBy: (group) => set({ groupBy: group }),

      addFilter: (filter) =>
        set((state) => {
          // 检查是否已存在相同字段的筛选条件
          const existingIndex = state.filters.findIndex((f) => f.field === filter.field)
          if (existingIndex >= 0) {
            // 覆盖现有筛选条件
            const newFilters = [...state.filters]
            newFilters[existingIndex] = filter
            return { filters: newFilters }
          }
          // 添加新的筛选条件
          return { filters: [...state.filters, filter] }
        }),

      removeFilter: (field) =>
        set((state) => ({
          filters: state.filters.filter((f) => f.field !== field),
        })),

      clearFilters: () => set({ filters: [] }),

      setSorting: (sorting) => set({ sorting }),

      setHydrated: (state) => set({ _hydrated: state }),
    }),
    {
      name: 'task-view-storage', // localStorage 键名
      partialize: (state) => ({
        viewMode: state.viewMode, // 持久化 viewMode
        groupBy: state.groupBy, // 持久化 groupBy
        // 不持久化 filters（每次进入页面重置）
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
