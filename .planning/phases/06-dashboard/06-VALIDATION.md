---
phase: 06
slug: dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for Feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                        |
| ---------------------- | ---------------------------- |
| **Framework**          | Vitest 3.2.4                 |
| **Config file**        | `vitest.config.ts`           |
| **Quick run command**  | `npm run test:unit`          |
| **Full suite command** | `npm run test:unit:coverage` |

- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max Feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement      | Test Type            | Automated Command                                                                 | File Exists | Status |
| ------- | ---- | ---- | ---------------- | -------------------- | --------------------------------------------------------------------------------- | ----------- | ------ |
| 00-W0   | 00   | 0    | All              | Wave 0 scaffolding   | `npm run test:unit -- tests/components/dashboard/`                                | ❌          | 🔴     |
| 01-T1   | 01   | 1    | DASH-02          | Component unit test  | `npm run test:unit -- tests/components/dashboard/TaskStatusDonut.test.tsx`        | ❌ Wave 0   | 🔴     |
| 01-T2   | 01   | 1    | DASH-02          | Component unit test  | `npm run test:unit -- tests/components/dashboard/PriorityDonut.test.tsx`          | ❌ Wave 0   | 🔴     |
| 02-T1   | 02   | 1    | DASH-04          | Component unit test  | `npm run test:unit -- tests/components/dashboard/ProjectComparisonChart.test.tsx` | ❌ Wave 0   | 🔴     |
| 02-T2   | 02   | 1    | DASH-05          | Component unit test  | `npm run test:unit -- tests/components/dashboard/MilestoneProgressList.test.tsx`  | ❌ Wave 0   | 🔴     |
| 03-T1   | 03   | 2    | DASH-01, DASH-03 | API integration test | `npm run test:unit -- tests/integration/database/dashboard.integration.test.ts`   | ✅ (extend) | 🟡     |
| 03-T2   | 03   | 2    | DASH-01~05       | Page integration     | Visual verification                                                               | N/A         | ⚪     |

_Status: 🔴 missing, 🟡 partial, 🟢 passing, ⚪ manual, ⚠ flaky_

---

## Wave 0 Requirements

- [ ] `tests/components/dashboard/TaskStatusDonut.test.tsx` — stubs for DASH-02
- [ ] `tests/components/dashboard/PriorityDonut.test.tsx` — stubs for DASH-02
- [ ] `tests/components/dashboard/ProjectComparisonChart.test.tsx` — stubs for DASH-04
- [ ] `tests/components/dashboard/MilestoneProgressList.test.tsx` — stubs for DASH-05
- [ ] `tests/components/dashboard/ChartCard.test.tsx` — stubs for shared wrapper

_If None: "Existing Infrastructure covers all phase requirements."_

---

## Manual-Only Verifications

| Behavior                                | Requirement      | Why Manual                          | Test Instructions                                                      |
| --------------------------------------- | ---------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Chart renders correctly at 280px height | DASH-02, DASH-04 | Visual chart rendering verification | Load dashboard, verify 2x2 grid renders all 4 charts at uniform height |
| Donut chart center label shows total    | DASH-02          | SVG text rendering check            | Hover over donut slices, verify tooltip + center label                 |
| Progress bar animation smooth           | DASH-05          | Animation frame timing              | Navigate to dashboard, observe progress bar fill animation             |
| Dashboard layout on mobile              | D-08             | Responsive layout check             | Resize browser to 768px, verify charts stack vertically                |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
