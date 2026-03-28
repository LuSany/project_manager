---
phase: 3
slug: kanban-list
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-26
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:unit:coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:unit:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-00-01 | 00 | 0 | TASK-01, TASK-02, TASK-05 | unit | `vitest run tests/helpers/task-factory.test.ts --passWithNoTests` | ✅ W0 | ⬜ pending |
| 03-00-02 | 00 | 0 | TASK-01 | unit | `vitest run src/stores/__tests__/taskViewStore.test.ts --passWithNoTests` | ✅ W0 | ⬜ pending |
| 03-00-03 | 00 | 0 | TASK-01 | unit | `vitest run src/components/tasks/list/__tests__ --passWithNoTests` | ✅ W0 | ⬜ pending |
| 03-00-04 | 00 | 0 | TASK-02 | unit | `vitest run src/components/tasks/kanban/__tests__ --passWithNoTests` | ✅ W0 | ⬜ pending |
| 03-00-05 | 00 | 0 | TASK-05 | unit | `vitest run src/components/tasks/detail/__tests__ --passWithNoTests` | ✅ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | TASK-01 | unit | `vitest run src/stores/__tests__/taskViewStore.test.ts` | ✅ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | TASK-01 | unit | `vitest run src/components/tasks/list/__tests__/TaskList.test.tsx` | ✅ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | TASK-01 | unit | `vitest run src/components/tasks/list/__tests__/TaskListFilters.test.tsx` | ✅ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | TASK-01 | unit | `vitest run src/components/tasks/list/__tests__/InlineEditCell.test.tsx` | ✅ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | TASK-02 | unit | `vitest run src/components/tasks/__tests__/TaskKanban.test.tsx` | ✅ existing | ⬜ pending |
| 03-02-02 | 02 | 1 | TASK-02 | unit | `vitest run src/components/tasks/kanban/__tests__/KanbanInlineEdit.test.tsx` | ✅ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | TASK-02 | unit | `vitest run src/components/tasks/kanban/__tests__/SortableTaskCard.test.tsx` | ✅ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | TASK-05 | unit | `vitest run src/components/tasks/detail/__tests__/TaskDetailDrawer.test.tsx` | ✅ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | TASK-05 | unit | `vitest run src/components/tasks/detail/__tests__/DetailTab.test.tsx` | ✅ W0 | ⬜ pending |
| 03-03-03 | 03 | 2 | TASK-05 | unit | `vitest run src/components/tasks/detail/__tests__/CommentsTab.test.tsx` | ✅ W0 | ⬜ pending |
| 03-03-04 | 03 | 2 | TASK-05 | unit | `vitest run src/components/tasks/detail/__tests__/TagsTab.test.tsx` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Wave 0 Plan Created:** `03-00-PLAN.md`

All Wave 0 test files will be created by Plan 03-00:

- [x] `src/stores/__tests__/taskViewStore.test.ts` — covers TASK-01 视图状态管理
- [x] `src/components/tasks/list/__tests__/TaskList.test.tsx` — covers TASK-01 列表视图
- [x] `src/components/tasks/list/__tests__/TaskListFilters.test.tsx` — covers TASK-01 筛选栏
- [x] `src/components/tasks/list/__tests__/InlineEditCell.test.tsx` — covers TASK-01 内联编辑
- [x] `src/components/tasks/kanban/__tests__/KanbanInlineEdit.test.tsx` — covers TASK-02 卡片内联编辑
- [x] `src/components/tasks/kanban/__tests__/SortableTaskCard.test.tsx` — covers TASK-02 卡片组件
- [x] `src/components/tasks/detail/__tests__/TaskDetailDrawer.test.tsx` — covers TASK-05 抽屉
- [x] `src/components/tasks/detail/__tests__/DetailTab.test.tsx` — covers TASK-05 详情 Tab
- [x] `src/components/tasks/detail/__tests__/CommentsTab.test.tsx` — covers TASK-05 评论 Tab
- [x] `src/components/tasks/detail/__tests__/TagsTab.test.tsx` — covers TASK-05 标签 Tab
- [x] `tests/helpers/task-factory.ts` — 任务测试数据工厂

*Existing: `src/components/tasks/__tests__/TaskKanban.test.tsx` 已覆盖部分 TASK-02*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 拖拽动画流畅性 | TASK-02 | 动画体验需人工评估 | 在看板中拖拽任务卡片，确认平滑移动、其他卡片平滑让位 |
| 内联编辑交互 | TASK-01, TASK-02 | 点击激活体验需人工评估 | 单击字段激活编辑，确认下拉/日期选择器正确显示 |
| 抽屉 Tab 切换 | TASK-05 | Tab 切换体验需人工评估 | 点击不同 Tab，确认内容正确加载、切换流畅 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending