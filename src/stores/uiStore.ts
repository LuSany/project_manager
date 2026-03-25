/**
 * UI Store
 * UI 状态管理 - 基于 Zustand + persist 中间件
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * UI State 接口
 */
interface UIState {
  /** 侧边栏折叠状态 */
  sidebarCollapsed: boolean
  /** 当前激活的模态框 */
  activeModal: string | null
  /** hydration 状态标记 (用于 SSR hydration 检测) */
  _hydrated: boolean
}

/**
 * UI Actions 接口
 */
type UIActions = {
  /** 切换侧边栏折叠状态 */
  toggleSidebar: () => void
  /** 直接设置侧边栏折叠状态 */
  setSidebarCollapsed: (collapsed: boolean) => void
  /** 设置当前激活的模态框 */
  setModal: (modal: string | null) => void
  /** 关闭模态框 */
  closeModal: () => void
  /** 设置 hydration 状态 */
  setHydrated: (state: boolean) => void
}

/**
 * UI Store
 * 使用 persist 中间件持久化 sidebarCollapsed 状态到 localStorage
 */
export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeModal: null,
      _hydrated: false,

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: (collapsed) =>
        set({
          sidebarCollapsed: collapsed,
        }),

      setModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),

      setHydrated: (state) => set({ _hydrated: state }),
    }),
    {
      name: 'ui-storage', // localStorage 键名
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed, // 仅持久化 sidebarCollapsed
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)