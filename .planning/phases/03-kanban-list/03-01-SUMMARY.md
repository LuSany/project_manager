---
phase: 03-kanban-list
plan: "01"
subsystem: task-list-view
tags: [task-management, list-view, tanstack-table, zustand, tdd]
requires:
  - TASK-01
provides:
  - 任务列表视图组件体系
  - 视图状态管理
  - 筛选和分组功能
  - 内联编辑单元格
affects:
  - src/app/projects/[id]/tasks/page.tsx
tech-stack:
  added:
    - Zustand persist middleware for view state
    - TanStack Table grouping and sorting
    - Radix UI Popover + Select for inline editing
  patterns:
    - TDD with Vitest
    - Store-based view state management
    - Column definitions with TanStack Table
key-files:
  created:
    - src/stores/taskViewStore.ts
    - src/components/tasks/list/TaskList.tsx
    - src/components/tasks/list/TaskListColumns.tsx
    - src/components/tasks/list/TaskListFilters.tsx
    - src/components/tasks/list/InlineEditCell.tsx
  modified:
    - src/app/projects/[id]/tasks/page.tsx
  tested:
    - src/stores/__tests__/taskViewStore.test.ts (19 tests)
    - src/components/tasks/list/__tests__/TaskList.test.tsx (12 tests)
    - src/components/tasks/list/__tests__/TaskListFilters.test.tsx (5 tests)
    - src/components/tasks/list/__tests__/InlineEditCell.test.tsx (7 tests)
decisions:
  - 使用 Zustand persist 中间件持久化 viewMode 和 groupBy
  - 使用 TanStack Table 的 getGroupedRowModel 实现分组
  - 内联编辑使用 Popover + Select 组合
  - 状态筛选使用 'none' 代替空字符串（Radix Select 限制）
metrics:
  duration: "20min"
  tasks: 5
  files: 10
  tests: 43
---

# Phase 03 Plan 01: 任务列表视图 Summary

实现任务列表视图，支持排序、筛选、分组和内联编辑功能。

## 一句话总结

使用 TanStack Table 和 Zustand 构建完整的任务列表视图组件体系，包括视图状态管理、筛选栏、分组显示和内联编辑单元格。

## 完成的任务

### Task 1: 创建 taskViewStore 视图状态管理

**实现内容:**
- 定义 TaskViewMode 类型 ('list' | 'kanban')
- 定义 GroupByOption 类型 ('status' | 'priority' | 'assignee' | null)
- 实现 FilterCondition 接口
- 使用 Zustand persist 中间件持久化 viewMode 和 groupBy
- 实现 setViewMode, setGroupBy, addFilter, removeFilter, clearFilters, setSorting actions

**测试验证:**
- 19 个测试用例全部通过
- 覆盖默认状态、状态切换、筛选操作、类型导出

**Commit:** 00e7728

### Task 2: 创建 TaskList 组件和列定义

**实现内容:**
- 创建 TaskListColumns.tsx 定义 6 列：任务名称、状态、优先级、截止日期、负责人、标签
- 使用 TanStack Table 的 useReactTable 配置分组、排序、筛选
- 实现 GroupHeader 组件显示分组标题
- 行高 48px，悬停样式 bg-accent/50

**测试验证:**
- 12 个测试用例全部通过
- 覆盖列定义、排序配置、组件导出

**Commit:** 6a05a47

### Task 3: 创建筛选栏组件

**实现内容:**
- 分组选择下拉（不分组/按状态/按优先级/按负责人）
- 状态筛选下拉（8 种状态选项）
- 优先级筛选下拉（4 种优先级选项）
- 已激活的筛选标签显示和移除
- 清除筛选按钮

**测试验证:**
- 5 个测试用例全部通过
- 覆盖组件渲染、下拉选项、store 集成

**Commit:** 5be4b04

### Task 4: 创建内联编辑单元格组件

**实现内容:**
- StatusCell: 使用 Popover + Select 实现状态下拉选择
- PriorityCell: 使用 Popover + Select 实现优先级下拉选择
- DueDateCell: 使用 Popover + date input 实现日期选择
- 所有单元格支持 44x44px 最小触摸区域

**测试验证:**
- 7 个测试用例全部通过
- 覆盖组件导出、徽章渲染、日期显示

**Commit:** 09efbdb

### Task 5: 集成视图切换到任务页面

**实现内容:**
- 导入 useTaskViewStore 替换本地 viewMode 状态
- 导入 TaskList 和 TaskListFilters 组件
- 实现 handleTaskUpdate 处理内联编辑
- 从 store 读取 filters 传递给 API 查询
- 保持看板视图使用 TaskKanban 组件

**验证:**
- 构建成功通过
- 页面正确渲染列表/看板视图

**Commit:** 15a08b7

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Radix Select 不支持空字符串 value**

- **Found during:** Task 3 实现
- **Issue:** Radix Select.Item 的 value 不能是空字符串
- **Fix:** 将 GROUP_BY_OPTIONS 中空字符串改为 'none'，并在 handleGroupByChange 中处理
- **Files modified:** TaskListFilters.tsx
- **Commit:** 5be4b04

**2. [Rule 3 - Blocking] React 未导入导致组件测试失败**

- **Found during:** Task 3 测试
- **Issue:** TaskListFilters.tsx 缺少 React 导入
- **Fix:** 添加 `import React from 'react'`
- **Files modified:** TaskListFilters.tsx
- **Commit:** 5be4b04

## 验证结果

### 测试统计

| 测试文件 | 测试数 | 状态 |
|---------|-------|------|
| taskViewStore.test.ts | 19 | PASSED |
| TaskList.test.tsx | 12 | PASSED |
| TaskListFilters.test.tsx | 5 | PASSED |
| InlineEditCell.test.tsx | 7 | PASSED |
| **总计** | **43** | **ALL PASSED** |

### 构建结果

- **状态:** 成功
- **命令:** `npm run build`
- **关键页面:** `/projects/[id]/tasks` - 36.8 kB

## 文件清单

### 新增文件

| 文件 | 用途 | 行数 |
|-----|------|-----|
| src/stores/taskViewStore.ts | 视图状态管理 | 133 |
| src/components/tasks/list/TaskList.tsx | 列表主组件 | 170 |
| src/components/tasks/list/TaskListColumns.tsx | 列定义 | 175 |
| src/components/tasks/list/TaskListFilters.tsx | 筛选栏 | 248 |
| src/components/tasks/list/InlineEditCell.tsx | 内联编辑 | 250 |

### 修改文件

| 文件 | 改动 |
|-----|------|
| src/app/projects/[id]/tasks/page.tsx | 集成新组件，替换 viewMode 状态 |

## 下一步

- Plan 02: 看板视图增强（D-05 到 D-08）
- Plan 03: 任务详情抽屉（D-09, D-10）

---

*Phase: 03-kanban-list*
*Plan: 01*
*Completed: 2026-03-26*

## Self-Check: PASSED

- 所有创建的文件已验证存在
- 5 个提交已确认（00e7728, 6a05a47, 5be4b04, 09efbdb, 15a08b7）
- 43 个测试全部通过
- 构建成功
