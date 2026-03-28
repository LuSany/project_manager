---
phase: 04
slug: calendar
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | TASK-03 | unit | `npm run test -- --run src/components/tasks/calendar/__tests__/TaskCalendar.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | TASK-03 | unit | `npm run test -- --run src/components/tasks/calendar/__tests__/CalendarTaskCard.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | TASK-03 | unit | `npm run test -- --run src/components/tasks/calendar/__tests__/CalendarDayCell.test.tsx` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | TASK-03 | unit | `npm run test -- --run src/components/tasks/calendar/__tests__/UnscheduledTaskList.test.tsx` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 2 | TASK-03 | unit | `npm run test -- --run src/components/tasks/calendar/__tests__/QuickCreatePopover.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/tasks/calendar/__tests__/TaskCalendar.test.tsx` — stubs for calendar view rendering
- [ ] `src/components/tasks/calendar/__tests__/CalendarTaskCard.test.tsx` — stubs for task card component
- [ ] `src/components/tasks/calendar/__tests__/CalendarDayCell.test.tsx` — stubs for day cell component
- [ ] `src/components/tasks/calendar/__tests__/UnscheduledTaskList.test.tsx` — stubs for no-date task list
- [ ] `src/components/tasks/calendar/__tests__/QuickCreatePopover.test.tsx` — stubs for quick create

*Existing Vitest infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 拖拽任务更新日期 | TASK-03 | DnD 交互难以完全自动化 | 1. 打开日历视图 2. 拖拽任务卡片到新日期 3. 验证任务截止日期已更新 |
| 点击日期快速创建 | TASK-03 | Popover 交互需视觉验证 | 1. 点击空白日期 2. 填写任务标题 3. 验证任务已创建并显示在日历中 |
| 视图切换 | TASK-03 | UI 状态切换需人工确认 | 1. 点击视图切换按钮 2. 验证列表/看板/日历视图正确切换 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending