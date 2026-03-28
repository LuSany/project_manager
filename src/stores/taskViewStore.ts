/**
 * Task View Store
 * 任务视图状态管理 - 基于 Zustand
 */

import { create } from 'zustand'
import type { SortingState } from '@tanstack/react-table'

// ============================================================================
// 类型定义
// ============================================================================

/** 视图模式类型 */
export type TaskViewMode = 'list' | 'kanban' | 'calendar' | 'gantt'

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
  /** 视图模式：列表 / 看板 / 日历 / 甘特图 */
  viewMode: TaskViewMode
  /** 分组维度 */
  groupBy: GroupByOption
  /** 筛选条件列表 */
  filters: FilterCondition[]
  /** 排序规则 */
  sorting: SortingState
  /** 甘特图时间刻度模式 */
  ganttScaleMode: 'day' | 'week' | 'month'
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
  /** 设置甘特图时间刻度模式 */
  setGanttScaleMode: (mode: 'day' | 'week' | 'month') => void
}

// ============================================================================
// Store 实现 - 无 persist 中间件（排查卡死问题）
// ============================================================================

export const useTaskViewStore = create<TaskViewState & TaskViewActions>()((set) => ({
  // 默认状态
  viewMode: 'list',
  groupBy: null,
  filters: [],
  sorting: [
    { id: 'priority', desc: true },
    { id: 'dueDate', desc: false },
  ],
  ganttScaleMode: 'day',

  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),

  setGroupBy: (group) => set({ groupBy: group }),

  addFilter: (filter) =>
    set((state) => {
      const existingIndex = state.filters.findIndex((f) => f.field === filter.field)
      if (existingIndex >= 0) {
        const newFilters = [...state.filters]
        newFilters[existingIndex] = filter
        return { filters: newFilters }
      }
      return { filters: [...state.filters, filter] }
    }),

  removeFilter: (field) =>
    set((state) => ({
      filters: state.filters.filter((f) => f.field !== field),
    })),

  clearFilters: () => set({ filters: [] }),

  setSorting: (sorting) => set({ sorting }),

  setGanttScaleMode: (mode) => set({ ganttScaleMode: mode }),
}))
