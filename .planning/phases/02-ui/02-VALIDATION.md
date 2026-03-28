---
phase: 02
slug: ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test:unit -- --run tests/unit/stores/uiStore.test.ts tests/unit/hooks/useCommandPalette.test.ts` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --run`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LAYOUT-02 | unit | `npm run test:unit -- --run tests/unit/stores/uiStore.test.ts` | ✅ 需扩展 | ⬜ pending |
| 02-01-02 | 01 | 1 | LAYOUT-02 | unit | `npm run test:unit -- --run tests/unit/hooks/useTheme.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | LAYOUT-04 | unit | `npm run test:unit -- --run tests/unit/hooks/useCommandPalette.test.ts` | ✅ 需扩展 | ⬜ pending |
| 02-02-02 | 02 | 1 | LAYOUT-04 | unit | `npm run test:unit -- --run tests/unit/components/ui/command-palette.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/hooks/useTheme.test.ts` — 新建，测试主题应用逻辑（DOM class 切换）
- [ ] `tests/unit/stores/uiStore.test.ts` — 扩展测试 theme 状态、setTheme、toggleTheme
- [ ] `tests/unit/hooks/useCommandPalette.test.ts` — 扩展测试最近访问、收藏功能
- [ ] `tests/unit/components/ui/command-palette.test.tsx` — 新建，测试分组渲染、快捷键

*现有测试基础设施完善，只需扩展测试用例覆盖新功能。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 主题切换无闪烁 | LAYOUT-02 | SSR hydration 行为难以自动化验证 | 1. 设置深色主题 2. 刷新页面 3. 观察无白色闪烁 |
| Cmd+K 快捷键 | LAYOUT-04 | 需要真实键盘输入 | 1. 按 Cmd+K 2. 确认面板打开 3. 按 ESC 确认关闭 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending