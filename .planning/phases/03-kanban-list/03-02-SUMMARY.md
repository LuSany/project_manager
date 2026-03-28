---
phase: 03-kanban-list
plan: 02
subsystem: frontend
tags: [kanban, inline-edit, drag-drop, dnd-kit, tdd]
requires:
  - 03-00
  - 03-01
provides:
  - KanbanInlineEdit component for priority and assignee editing
  - SortableTaskCard independent component with inline editing
  - Enhanced TaskKanban with drag-over highlights and optimistic updates
affects:
  - src/components/tasks/TaskKanban.tsx
  - src/components/tasks/kanban/
key-files:
  created:
    - src/components/tasks/kanban/KanbanInlineEdit.tsx
    - src/components/tasks/kanban/SortableTaskCard.tsx
  modified:
    - src/components/tasks/TaskKanban.tsx
    - src/components/tasks/kanban/__tests__/KanbanInlineEdit.test.tsx
    - src/components/tasks/kanban/__tests__/SortableTaskCard.test.tsx
    - src/components/tasks/__tests__/TaskKanban.test.tsx
decisions:
  - D-08: 内联编辑使用 Popover + 自定义下拉组合
  - D-06: 拖拽动画使用 scale-95 rotate-2 opacity-50 效果
  - D-07: 拖放直接生效，无确认弹窗
  - 列顺序按工作流优先级排列：待办 → 进行中 → 已完成 → 阻塞
metrics:
  duration: 30min
  tasks: 3
  tests: 20
  files: 6
---

# Phase 03 Plan 02: 看板内联编辑与拖拽增强 Summary

增强看板视图，支持卡片内联编辑和优化拖拽交互体验。实现 PriorityInlineEdit 和 AssigneeInlineEdit 组件，提取 SortableTaskCard 为独立组件，并优化看板列交互。

## One-liner

实现看板卡片内联编辑组件（优先级、负责人），提取 SortableTaskCard 独立组件，并增强拖拽交互视觉反馈。

## Changes

### Task 1: 创建卡片内联编辑组件

**PriorityInlineEdit:**
- 使用 Popover + 自定义下拉选择器组合
- 支持四种优先级：低、中、高、紧急
- 点击徽章弹出选择器，选择后自动关闭
- 复用 PRIORITY_COLORS 常量保持样式一致

**AssigneeInlineEdit:**
- 使用 Popover + 多选列表组合
- 显示当前负责人头像组（最多3个，超出显示 +N）
- 点击头像组弹出成员选择器
- 从项目成员 API 获取可选负责人列表
- 支持多选/取消选择

### Task 2: 提取 SortableTaskCard 为独立组件

- 从 TaskKanban.tsx 提取 SortableTaskCard 组件
- 集成 PriorityInlineEdit 和 AssigneeInlineEdit
- 添加 onUpdate 和 onOpenDetail props
- 实现拖拽样式：scale-95 rotate-2 opacity-50 shadow-xl
- 添加 projectId prop 支持负责人编辑

### Task 3: 增强看板列交互和视觉效果

**拖拽交互增强:**
- 添加 onDragOver 处理跟踪悬停列
- 拖拽到列上时高亮：border-primary bg-primary/5 scale-[1.02]
- Drop 后立即更新状态（无确认弹窗）
- 使用乐观更新 + 错误回滚

**列布局优化:**
- 列最小宽度：280px
- 列间距：24px (gap-6)
- 列顺序按工作流优先级：待办 → 进行中 → 已完成 → 阻塞
- 其他状态列放在后面

## Tests

| File | Tests | Status |
|------|-------|--------|
| KanbanInlineEdit.test.tsx | 7 | PASS |
| SortableTaskCard.test.tsx | 8 | PASS |
| TaskKanban.test.tsx | 5 | PASS |
| **Total** | **20** | **PASS** |

## Key Decisions

1. **内联编辑组件设计** - 使用 Popover + 自定义下拉而非 Radix Select，便于控制样式和交互
2. **乐观更新策略** - 所有 mutation 使用 onMutate 乐观更新，onError 回滚，提升用户体验
3. **列顺序重排** - 按工作流优先级排列列顺序，提高常用操作效率
4. **类型兼容性** - onUpdate 使用 flexible type 支持扩展

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

1. **AssigneeInlineEdit projectId fallback** - `src/components/tasks/kanban/SortableTaskCard.tsx:98`
   - Uses `projectId || task.id` as fallback
   - Should be replaced with actual projectId from parent component

## Commits

| Hash | Message |
|------|---------|
| b8d781f | feat(03-02): add KanbanInlineEdit component for priority and assignee editing |
| de2d7d7 | feat(03-02): extract SortableTaskCard as independent component |
| 0b941ef | feat(03-02): enhance TaskKanban with drag-over highlights and optimistic updates |
| 543549d | fix(03-02): fix type compatibility for onUpdate callbacks |

## Verification

- [x] npm run test:unit - 20 tests passed
- [x] npm run build - Build successful
- [x] All kanban cards support inline editing
- [x] Drag-over column highlights work correctly
- [x] Optimistic updates with rollback on error

## Self-Check: PASSED

- [x] KanbanInlineEdit.tsx exists
- [x] SortableTaskCard.tsx exists
- [x] TaskKanban.tsx exists and imports from new components
- [x] 4 commits created (b8d781f, de2d7d7, 0b941ef, 543549d)
- [x] 20 tests passing

---

*Completed: 2026-03-26*
*Duration: ~30 minutes*