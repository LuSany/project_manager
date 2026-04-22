---
phase: 07
slug: guan-li-hou-tai
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-23
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test:unit -- tests/admin/{feature}.test.ts --run` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- tests/admin/{feature}.test.ts --run`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | ADMIN-01 | unit | `npm run test:unit -- tests/admin/users.test.ts --run` | ✅ | ✅ green |
| 07-01-02 | 01 | 1 | ADMIN-01 | unit | `npm run test:unit -- tests/admin/users.test.ts --run` | ✅ | ✅ green |
| 07-02-01 | 02 | 1 | ADMIN-02 | unit | `npm run test:unit -- tests/admin/projects.test.ts --run` | ✅ | ✅ green |
| 07-02-02 | 02 | 1 | ADMIN-02 | unit | `npm run test:unit -- tests/admin/projects.test.ts --run` | ✅ | ✅ green |
| 07-03-01 | 03 | 1 | ADMIN-05 | unit | `npm run test:unit -- tests/admin/ai.test.ts --run` | ✅ | ✅ green |
| 07-04-01 | 04 | 2 | ADMIN-03 | unit | `npm run test:unit -- tests/admin/permissions.test.ts --run` | ✅ | ✅ green |
| 07-05-01 | 05 | 2 | ADMIN-04 | unit | `npm run test:unit -- tests/admin/audit-logs.test.ts --run` | ✅ | ✅ green |

---

## Wave 0 Requirements

- [x] `tests/admin/users.test.ts` — 19 tests for ADMIN-01 (CRUD, bulk ops, CSV import)
- [x] `tests/admin/projects.test.ts` — 16 tests for ADMIN-02 (CRUD, member mgmt, lifecycle)
- [x] `tests/admin/permissions.test.ts` — 19 tests for ADMIN-03 (RBAC, resource-based)
- [x] `tests/admin/ai.test.ts` — 23 tests for ADMIN-05 (CRUD, connection test)
- [x] `tests/admin/conftest.ts` — shared fixtures (mockAdminUser, mockUserFactory, mockProjectFactory)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI connection test with real API keys | ADMIN-05 | External API keys are secrets | Configure test key in .env, run manual test via UI |
| CSV file upload parsing in browser | ADMIN-01 | File system access | Upload sample CSV via UI, verify preview shows correct data |
| Dark theme visual verification | D-25 | Visual rendering | Toggle dark mode in browser, verify badge colors |
| Permission inheritance UI display | ADMIN-03 | Complex UI state | Add user as PROJECT_MEMBER, verify inherited badge shows |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-23

---

## Validation Audit 2026-04-23

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

**Files created/updated:**
- tests/admin/users.test.ts (19 tests)
- tests/admin/projects.test.ts (16 tests)
- tests/admin/permissions.test.ts (19 tests - new)
- tests/admin/ai.test.ts (23 tests)

---
_Validated: 2026-04-23_
_Verifier: Claude (gsd-nyquist-auditor)_