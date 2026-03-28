---
phase: 01
slug: ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test:unit -- --reporter=dot` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --reporter=dot`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | LAYOUT-01 | unit | `vitest run tests/unit/stores/uiStore.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | LAYOUT-01 | unit | `vitest run tests/unit/hooks/useMediaQuery.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | LAYOUT-01 | unit | `vitest run tests/unit/components/layout/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | LAYOUT-03 | unit | `vitest run tests/unit/components/layout/Header.test.tsx` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | LAYOUT-03 | unit | `vitest run tests/unit/components/layout/MobileNav.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/stores/uiStore.test.ts` — stubs for LAYOUT-01 state persistence
- [ ] `tests/unit/hooks/useMediaQuery.test.ts` — stubs for responsive breakpoint detection
- [ ] `tests/unit/components/layout/Sidebar.test.tsx` — stubs for LAYOUT-01 collapse behavior
- [ ] `tests/unit/components/layout/Header.test.tsx` — stubs for LAYOUT-03 responsive behavior
- [ ] `tests/unit/components/layout/MobileNav.test.tsx` — stubs for LAYOUT-03 mobile navigation
- [ ] `src/components/ui/sheet.tsx` — Sheet component for mobile drawer (component, not test)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SSR 无闪烁加载 | LAYOUT-01 | 需要验证页面刷新时布局不闪烁 | 刷新页面，观察侧边栏是否平滑显示，无展开→折叠跳变 |
| 触摸区域大小 | LAYOUT-03 | 需要在移动设备上手动测试 | 在移动端点击导航项，验证点击区域 >= 44x44px |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending