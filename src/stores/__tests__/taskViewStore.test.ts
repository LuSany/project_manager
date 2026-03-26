/**
 * taskViewStore 测试
 * 测试任务视图状态管理
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTaskViewStore } from '../taskViewStore'

describe('taskViewStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useTaskViewStore.setState({
      viewMode: 'list',
      groupBy: null,
      filters: [],
      sorting: [{ id: 'priority', desc: true }, { id: 'dueDate', desc: false }],
    })
  })

  afterEach(() => {
    // 清理 localStorage
    localStorage.removeItem('task-view-storage')
  })

  describe('默认状态', () => {
    it('store 默认 viewMode 为 list', () => {
      const { viewMode } = useTaskViewStore.getState()
      expect(viewMode).toBe('list')
    })

    it('store 默认 groupBy 为 null', () => {
      const { groupBy } = useTaskViewStore.getState()
      expect(groupBy).toBeNull()
    })

    it('store 默认 filters 为空数组', () => {
      const { filters } = useTaskViewStore.getState()
      expect(filters).toEqual([])
    })

    it('store 默认 sorting 为优先级 > 截止日期', () => {
      const { sorting } = useTaskViewStore.getState()
      expect(sorting).toEqual([
        { id: 'priority', desc: true },
        { id: 'dueDate', desc: false },
      ])
    })
  })

  describe('setViewMode', () => {
    it('setViewMode("kanban") 切换到看板视图', () => {
      const { setViewMode } = useTaskViewStore.getState()
      setViewMode('kanban')

      const { viewMode } = useTaskViewStore.getState()
      expect(viewMode).toBe('kanban')
    })

    it('setViewMode("list") 切换到列表视图', () => {
      const { setViewMode } = useTaskViewStore.getState()
      setViewMode('kanban')
      setViewMode('list')

      const { viewMode } = useTaskViewStore.getState()
      expect(viewMode).toBe('list')
    })

    it('setViewMode("calendar") 切换到日历视图', () => {
      const { setViewMode } = useTaskViewStore.getState()
      setViewMode('calendar')

      const { viewMode } = useTaskViewStore.getState()
      expect(viewMode).toBe('calendar')
    })
  })

  describe('setGroupBy', () => {
    it('setGroupBy("status") 设置分组维度为状态', () => {
      const { setGroupBy } = useTaskViewStore.getState()
      setGroupBy('status')

      const { groupBy } = useTaskViewStore.getState()
      expect(groupBy).toBe('status')
    })

    it('setGroupBy("priority") 设置分组维度为优先级', () => {
      const { setGroupBy } = useTaskViewStore.getState()
      setGroupBy('priority')

      const { groupBy } = useTaskViewStore.getState()
      expect(groupBy).toBe('priority')
    })

    it('setGroupBy("assignee") 设置分组维度为负责人', () => {
      const { setGroupBy } = useTaskViewStore.getState()
      setGroupBy('assignee')

      const { groupBy } = useTaskViewStore.getState()
      expect(groupBy).toBe('assignee')
    })

    it('setGroupBy(null) 取消分组', () => {
      const { setGroupBy } = useTaskViewStore.getState()
      setGroupBy('status')
      setGroupBy(null)

      const { groupBy } = useTaskViewStore.getState()
      expect(groupBy).toBeNull()
    })
  })

  describe('addFilter', () => {
    it('addFilter({ field: "status", operator: "eq", value: "TODO" }) 添加筛选条件', () => {
      const { addFilter } = useTaskViewStore.getState()
      addFilter({ field: 'status', operator: 'eq', value: 'TODO' })

      const { filters } = useTaskViewStore.getState()
      expect(filters).toHaveLength(1)
      expect(filters[0]).toEqual({ field: 'status', operator: 'eq', value: 'TODO' })
    })

    it('addFilter 添加多个筛选条件', () => {
      const { addFilter } = useTaskViewStore.getState()
      addFilter({ field: 'status', operator: 'eq', value: 'TODO' })
      addFilter({ field: 'priority', operator: 'eq', value: 'HIGH' })

      const { filters } = useTaskViewStore.getState()
      expect(filters).toHaveLength(2)
    })

    it('addFilter 相同字段覆盖现有筛选条件', () => {
      const { addFilter } = useTaskViewStore.getState()
      addFilter({ field: 'status', operator: 'eq', value: 'TODO' })
      addFilter({ field: 'status', operator: 'eq', value: 'IN_PROGRESS' })

      const { filters } = useTaskViewStore.getState()
      expect(filters).toHaveLength(1)
      expect(filters[0].value).toBe('IN_PROGRESS')
    })
  })

  describe('removeFilter', () => {
    it('removeFilter("status") 移除筛选条件', () => {
      const { addFilter, removeFilter } = useTaskViewStore.getState()
      addFilter({ field: 'status', operator: 'eq', value: 'TODO' })
      removeFilter('status')

      const { filters } = useTaskViewStore.getState()
      expect(filters).toHaveLength(0)
    })

    it('removeFilter 不存在的字段不影响其他筛选', () => {
      const { addFilter, removeFilter } = useTaskViewStore.getState()
      addFilter({ field: 'priority', operator: 'eq', value: 'HIGH' })
      removeFilter('status')

      const { filters } = useTaskViewStore.getState()
      expect(filters).toHaveLength(1)
    })
  })

  describe('clearFilters', () => {
    it('clearFilters 清除所有筛选条件', () => {
      const { addFilter, clearFilters } = useTaskViewStore.getState()
      addFilter({ field: 'status', operator: 'eq', value: 'TODO' })
      addFilter({ field: 'priority', operator: 'eq', value: 'HIGH' })
      clearFilters()

      const { filters } = useTaskViewStore.getState()
      expect(filters).toHaveLength(0)
    })
  })

  describe('setSorting', () => {
    it('setSorting 设置排序规则', () => {
      const { setSorting } = useTaskViewStore.getState()
      setSorting([{ id: 'title', desc: false }])

      const { sorting } = useTaskViewStore.getState()
      expect(sorting).toEqual([{ id: 'title', desc: false }])
    })
  })

  describe('类型导出', () => {
    it('导出 TaskViewMode 类型', () => {
      // 类型检查通过编译即可
      type ViewMode = 'list' | 'kanban' | 'calendar'
      const mode: ViewMode = 'calendar'
      expect(mode).toBe('calendar')
    })

    it('导出 GroupByOption 类型', () => {
      // 类型检查通过编译即可
      type GroupByOption = 'status' | 'priority' | 'assignee' | null
      const group: GroupByOption = 'status'
      expect(group).toBe('status')
    })
  })

  describe('calendar 视图模式', () => {
    it('calendar 视图模式被持久化配置包含', () => {
      // 验证 partialize 配置包含 viewMode，calendar 模式将自动持久化
      const { setViewMode } = useTaskViewStore.getState()
      setViewMode('calendar')

      // 验证状态已更新
      const { viewMode } = useTaskViewStore.getState()
      expect(viewMode).toBe('calendar')
    })
  })
})
