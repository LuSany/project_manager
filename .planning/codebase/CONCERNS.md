# Codebase Concerns

**Analysis Date:** 2026-03-25

---

## Technical Debt

### 1. Incomplete Feature Implementation

**Timesheet Page - Stub Implementation**
- **Issue:** Timesheet page (`src/app/(main)/timesheet/page.tsx:51`) contains explicit TODO comment with mock data instead of real API integration
- **Files:** `src/app/(main)/timesheet/page.tsx`
- **Impact:** Feature is non-functional; time tracking cannot be used in production
- **Fix approach:** Implement actual API endpoint `/api/v1/timesheet` and connect to database

### 2. Empty/Stub Action Implementations

**Zustand Store Stubs**
- **Issue:** Several store actions return state unchanged without implementing logic
- **Files:** `src/stores/boardStore.ts`
  - `moveCard` (line 212-218): Returns state without moving card
  - `sortViewCards` (line 266): Empty implementation
- **Impact:** Drag-drop functionality and view sorting are broken in kanban board
- **Fix approach:** Implement actual card movement logic with proper state updates

### 3. Code Duplication

**Multiple Task Status Mappings**
- **Issue:** Task status configuration duplicated across many files with inconsistent definitions
- **Files:**
  - `src/app/tasks/page.tsx` (lines 46-60)
  - `src/app/projects/[id]/tasks/page.tsx` (lines 97-112)
  - `src/app/projects/[id]/tasks/[taskId]/page.tsx` (lines 93-111)
  - `src/components/tasks/TaskKanban.tsx` (lines 78-96)
  - `src/components/tasks/task-status-badge.tsx` (lines 10-30)
- **Impact:** Maintenance burden; inconsistency risk when adding new statuses
- **Fix approach:** Centralize in `src/lib/task-constants.ts` and import everywhere

### 4. Schema Backup File

**Outdated Prisma Schema Backup**
- **Issue:** `prisma/schema.prisma.backup` (27KB) exists from Feb 24, likely outdated
- **Files:** `prisma/schema.prisma.backup`
- **Impact:** Confusion risk; potential for referencing wrong schema version
- **Fix approach:** Remove backup file or rename with date stamp if archival needed

---

## Known Issues

### 1. TypeScript Type Errors

**Unresolved Type Errors in Codebase**
- **Issue:** `npm run typecheck` reveals multiple TypeScript errors
- **Files:**
  - `src/components/tasks/__tests__/TaskKanban.test.tsx`: Unexported `SortableTaskCard` import
  - `tests/__mocks__/prisma.ts` (lines 603, 792): Unsafe type assertions
  - `tests/admin/ai-management.test.ts` (lines 22, 43): Wrong property name `aIConfig` vs `ai_configs`
- **Impact:** Reduced type safety; potential runtime errors
- **Fix approach:** Fix test mock types; export test components; correct Prisma client property names

### 2. Empty Catch Blocks

**Silent Error Swallowing**
- **Issue:** Empty catch block silently ignores errors
- **Files:** `tests/e2e/preview-debug.spec.ts:55`
- **Impact:** Debugging becomes difficult; errors hidden during test execution
- **Fix approach:** Add error logging or re-throw; document intentional suppression

---

## Security Concerns

### 1. Cookie-Based Authentication Without HttpOnly Flag Consistency

**User Info Stored in Cookies via Middleware**
- **Issue:** Middleware sets user cookies but implementation varies
- **Files:** `src/middleware.ts` (lines 121-141)
- **Risk:**
  - Uses `(payload as any)` type assertion bypassing type safety
  - Cookie security depends on `NODE_ENV` check; development environment less secure
- **Files:** `src/lib/auth.ts` - reads user from cookie without validation
- **Impact:** Potential session hijacking in development; type safety bypass
- **Fix approach:** Use consistent HttpOnly + Secure flags; validate cookie format; remove `as any`

### 2. Weak Default Secrets in .env.example

**Placeholder Secrets with Known Values**
- **Issue:** `.env.example` contains predictable default values
- **Files:** `.env.example` (lines 5-11)
  - `JWT_SECRET` with obvious placeholder text
  - `ENCRYPTION_KEY` with obvious placeholder text
- **Risk:** Developers may forget to change defaults in production
- **Fix approach:** Use generation scripts; add validation on startup

### 3. Exposed Environment Files

**Multiple Environment Files Committed**
- **Issue:** Multiple `.env*` files present
- **Files:** `.env`, `.env.local`, `.env.example`, `.env.test`
- **Risk:** Potential for accidental secret exposure if `.gitignore` misconfigured
- **Fix approach:** Keep only `.env.example`; ensure others in `.gitignore`

---

## Performance Bottlenecks

### 1. Large Component Files

**Oversized Components Difficult to Maintain**
- **Issue:** Several files exceed 400+ lines
- **Files:**
  - `src/app/projects/[id]/tasks/[taskId]/page.tsx` (746 lines)
  - `src/app/(main)/admin/users/page.tsx` (648 lines)
  - `src/app/projects/[id]/milestones/page.tsx` (592 lines)
  - `src/app/tasks/page.tsx` (483 lines)
  - `src/components/tasks/TaskKanban.tsx` (420 lines)
  - `src/components/reviews/ReviewEditDialog.tsx` (501 lines)
- **Impact:** Slow compilation; difficult testing; high cognitive load
- **Fix approach:** Extract sub-components; use custom hooks for logic separation

### 2. Console Logging in Production Code

**Console Statements Not Removed**
- **Issue:** Console.log/warn/error calls present in source files
- **Files:**
  - `src/lib/error-handler.ts:34` - console.error
  - `src/lib/preview/onlyoffice.ts:228` - console.warn
  - `src/lib/preview/onlyoffice.ts:365` - console.log
- **Impact:** Performance overhead; potential information leakage
- **Fix approach:** Use structured logging library; strip console in production build

---

## Fragile Areas

### 1. Board Store Persistence Partial Implementation

**Zustand Persistence Only Saves Partial State**
- **Issue:** `boardStore.ts` persists only `viewStates` (line 304-306)
- **Files:** `src/stores/boardStore.ts`
- **Fragility:** Users lose board/view/card data on refresh; inconsistent UX
- **Test coverage:** Tests exist (`src/stores/__tests__/boardStore.test.ts`, 518 lines) but don't cover persistence edge cases
- **Fix approach:** Either persist full state or implement server sync

### 2. Middleware Authentication Complexity

**Multiple Authentication Paths Create Complexity**
- **Issue:** Middleware supports Bearer token, cookie-based auth, and document key bypass
- **Files:** `src/middleware.ts` (67-152)
- **Fragility:**
  - Multiple auth paths increase attack surface
  - `(payload as any)` used 3 times (lines 121, 128, 135)
  - Document key bypass for file downloads may be exploitable
- **Fix approach:** Consolidate auth logic; use proper JWT verification utility

### 3. Prisma Mock Type Safety

**Test Mocks Use Unsafe Type Assertions**
- **Issue:** Mock Prisma client uses extensive `as any` assertions
- **Files:**
  - `tests/__mocks__/prisma.ts` (603, 792)
  - `tests/mocks/prisma-mock.ts` (191)
- **Fragility:** Mocks may not match real Prisma client; tests pass but fail in integration
- **Fix approach:** Use Prisma's built-in mocking or generate typed mocks

### 4. Review Wizard Early Return Pattern

**Complex Component with Null Returns**
- **Issue:** `ReviewWizard.tsx` has early return pattern that may hide bugs
- **Files:** `src/components/reviews/ReviewWizard.tsx:187`
- **Fragility:** Component silently returns null under certain conditions
- **Fix approach:** Add error boundary; log conditions causing null return

---

## Test Coverage Gaps

### 1. Untested API Routes

**Critical API Endpoints Lack Unit Tests**
- **Issue:** Many API routes have no dedicated tests
- **Files (untested or lightly tested):**
  - `src/app/api/v1/tasks/import/route.ts` - Import functionality
  - `src/app/api/v1/files/upload/route.ts` - File upload
  - `src/app/api/v1/ai/logs/route.ts` - AI logging
- **Risk:** Breaking changes undetected; regression risk
- **Priority:** High for import/upload; Medium for AI logs

### 2. Integration Test Dependencies on Mock Data

**Tests Use Hardcoded Task Status Values**
- **Issue:** Tests reference 'TODO' status directly instead of using constants
- **Files:**
  - `tests/integration/database/task-status.integration.test.ts` (multiple)
  - `tests/integration/dashboard.integration.test.ts` (multiple)
- **Risk:** If status enum changes, tests break silently
- **Priority:** Medium
- **Fix approach:** Import status constants from shared module

---

## Dependency Risks

### 1. React Version Mismatch Potential

**Mixed React 18 and Next.js 15**
- **Issue:** Using React 18.3.1 with Next.js 15.1.0
- **Files:** `package.json` (lines 52-57)
- **Risk:** Next.js 15 recommends React 19; potential compatibility issues
- **Fix approach:** Plan React 19 upgrade; test thoroughly

### 2. Prisma Client Regeneration Risk

**Schema Changes Require Manual Regeneration**
- **Issue:** `prisma generate` must be run after schema changes
- **Files:** `prisma/schema.prisma`
- **Risk:** Developers may forget to regenerate; runtime errors
- **Fix approach:** Add postinstall script; use Prisma generate in CI

---

## Recommendations

### Immediate Priority (P0)

1. **Fix board store moveCard implementation** - Core kanban functionality broken
2. **Fix TypeScript errors** - Restore type safety confidence
3. **Remove console.log from production code** - Clean up logging

### Short Term (P1)

4. **Consolidate task status constants** - Reduce duplication
5. **Implement timesheet API** - Complete feature
6. **Remove schema backup file** - Clean up repository

### Medium Term (P2)

7. **Refactor large components** - Improve maintainability
8. **Strengthen authentication** - Address security concerns
9. **Expand API test coverage** - Reduce regression risk

### Long Term (P3)

10. **Plan React 19 upgrade** - Stay current with Next.js
11. **Implement structured logging** - Replace console statements
12. **Server-side persistence for board store** - Improve UX

---

*Concerns audit: 2026-03-25*
