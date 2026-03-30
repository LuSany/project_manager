/**
 * Device Store
 * 设备管理状态管理 - 基于 Zustand
 */

import { create } from 'zustand'

// ============================================================================
// 类型定义
// ============================================================================

/** 设备状态类型 */
export type DeviceStatus = 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE' | 'DISABLED'

/** 设备筛选条件 */
export interface DeviceFilter {
  /** 按状态筛选 */
  status?: DeviceStatus
  /** 按类型ID筛选 */
  typeId?: string
  /** 按名称搜索 */
  name?: string
}

// ============================================================================
// State 接口
// ============================================================================

interface DeviceState {
  /** 筛选条件 */
  filters: DeviceFilter
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
}

// ============================================================================
// Actions 接口
// ============================================================================

interface DeviceActions {
  /** 设置筛选条件 */
  setFilters: (filters: DeviceFilter) => void
  /** 清除所有筛选条件 */
  clearFilters: () => void
  /** 设置当前页码 */
  setPage: (page: number) => void
  /** 设置每页数量 */
  setPageSize: (size: number) => void
}

// ============================================================================
// Store 实现
// ============================================================================

export const useDeviceStore = create<DeviceState & DeviceActions>()((set) => ({
  // 默认状态
  filters: {},
  page: 1,
  pageSize: 20,

  // Actions
  setFilters: (filters) => set({ filters, page: 1 }),

  clearFilters: () => set({ filters: {}, page: 1 }),

  setPage: (page) => set({ page }),

  setPageSize: (size) => set({ pageSize: size, page: 1 }),
}))
