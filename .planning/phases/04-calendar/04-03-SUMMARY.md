---
phase: 04-calendar
plan: 03
subsystem: tasks/calendar
tags: [components, dnd, tdd, react]
requires: [04-01]
provides: [UnscheduledTaskList, QuickCreatePopover]
affects: [calendar-module]
tech-stack:
  added: [date-fns locale, @dnd-kit useDraggable]
  patterns: [TDD, controlled popover, collapsible list]
key-files:
  created:
    - src/components/tasks/calendar/UnscheduledTaskList.tsx
    - src/components/tasks/calendar/QuickCreatePopover.tsx
  modified:
    - src/components/tasks/calendar/__tests__/UnscheduledTaskList.test.tsx
    - src/components/tasks/calendar/__tests__/QuickCreatePopover.test.tsx
    - src/components/tasks/calendar/index.ts
decisions:
  - Use useState for collapse state (not persisted)
  - QuickCreatePopover controlled by parent (open/onOpenChange props)
  - Task items use useDraggable with unscheduled-{id} prefix
metrics:
  duration: 8min
  tasks: 3
  files: 5
  tests: 19
---

# Phase 04 Plan 03: Unscheduled Task List & Quick Create Summary

## One-liner

实现无日期任务列表组件(可折叠、可拖拽)和快速创建任务弹窗组件(日期显示、标题输入)。

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create UnscheduledTaskList component | 61c4e36 | UnscheduledTaskList.tsx, UnscheduledTaskList.test.tsx |
| 2 | Create QuickCreatePopover component | 30e8446 | QuickCreatePopover.tsx, QuickCreatePopover.test.tsx |
| 3 | Update index.ts exports | 225a531 | index.ts |

## Key Implementations

### UnscheduledTaskList 组件

- 筛选 `dueDate === null` 的任务
- 默认折叠状态，点击标题栏展开/收起
- 显示任务数量在标题中
- 任务项使用 `useDraggable` 支持拖拽到日历
- 优先级颜色指示器 (border-l-{color})
- 空状态显示 "暂无未安排日期的任务"
- 测试: 9 个用例全部通过

### QuickCreatePopover 组件

- 受控组件模式 (open/onOpenChange)
- 显示选中日期 (中文格式: yyyy年M月d日)
- 标题输入框，placeholder "输入任务标题..."
- 空标题时提交按钮禁用
- ESC 键关闭弹窗
- 创建后清空输入并关闭
- 测试: 10 个用例全部通过

## Deviations from Plan

None - plan executed exactly as written.

## Test Results

```
✓ src/components/tasks/calendar/__tests__/UnscheduledTaskList.test.tsx (9 tests)
✓ src/components/tasks/calendar/__tests__/QuickCreatePopover.test.tsx (10 tests)
✓ All calendar tests (39 tests) passed
```

## Self-Check: PASSED

- [x] UnscheduledTaskList.tsx exists (115 lines)
- [x] QuickCreatePopover.tsx exists (86 lines)
- [x] index.ts exports 5 components
- [x] All commits exist in git history
- [x] All tests passing