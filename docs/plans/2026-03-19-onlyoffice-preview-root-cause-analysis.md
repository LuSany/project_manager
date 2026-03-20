# Review Material Preview Failure - Root Cause Analysis and Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `oh-my-claudecode:ultrawork` to implement this plan task-by-task with TDD approach.

**Goal:** Systematically identify and fix the root cause of "Review Material Preview Failure" where OnlyOffice displays "Error opening attachment" in Docker deployment on Linux.

**Architecture:** Multi-phase diagnostic approach with TDD verification for each fix. Start with highest-probability root causes (Docker networking, file existence, environment variables) and progress to lower-probability causes. Each fix includes automated tests to prevent regression.

**Tech Stack:** Docker, OnlyOffice Document Server, Next.js, TypeScript, Jest (unit), Playwright (E2E), Bash (diagnostic scripts)

**Estimated Duration:** 4-6 hours for complete execution
**Execution Mode:** ultrawork with parallel task execution where possible

---

## Executive Summary

### Problem Statement

OnlyOffice Document Server displays "打开附件时出现错误" (Error opening attachment) when attempting to preview review materials in the Docker deployment on Linux.

### Current Hypothesis

Primary root cause: `host.docker.internal` hostname resolution failure on Linux, which prevents OnlyOffice container from calling back to the main application.

### Evidence from Codebase Exploration

- `.env` uses hardcoded IP `172.20.157.10:3000` instead of `host.docker.internal:3000`
- `docker-compose.onlyoffice.yml` configures `host.docker.internal:host-gateway` but this may not work consistently on Linux
- 7+ previous fix attempts documented in `docs/plans/2026-03-17-review-attachment-preview-fix.md`

---

## Phase 0: Preparation and Baseline

### Task 0.1: Create Diagnostic Worktree

**Files:**

- Git worktree branch: `fix/onlyoffice-preview-diagnostics`

**Step 1: Create isolated worktree**

Run:

```bash
git worktree add -b fix/onlyoffice-preview-diagnostics ../project-manager-fix
```

Expected: New worktree created at `../project-manager-fix`

**Step 2: Verify worktree isolation**

Run:

```bash
git worktree list
```

Expected: Shows both main and fix worktrees

**Step 3: Commit worktree setup**

Run:

```bash
cd ../project-manager-fix
git status
```

Expected: Clean working directory on new branch

---

### Task 0.2: Document Current State

**Files:**

- Create: `docs/diagnostics/onlyoffice-current-state.md`

**Step 1: Capture current environment configuration**

Run:

```bash
cat .env | grep -E "(ONLYOFFICE|CALLBACK|NETWORK)" > docs/diagnostics/onlyoffice-env-current.txt
```

Expected: File contains current OnlyOffice-related environment variables

**Step 2: Capture current Docker configuration**

Run:

```bash
cat docker-compose.onlyoffice.yml > docs/diagnostics/onlyoffice-docker-current.yml
```

Expected: YAML file with current OnlyOffice Docker configuration

**Step 3: Document symptoms**

Create file with:

```markdown
# Current Symptoms

- Error: "打开附件时出现错误"
- Environment: Docker on Linux
- Previous fixes: 7+ attempts
- Most likely cause: host.docker.internal resolution failure
```

**Step 4: Commit baseline**

Run:

```bash
git add docs/diagnostics/
git commit -m "docs: capture current OnlyOffice configuration baseline"
```

---

### Task 0.3: Setup Diagnostic Test Framework

**Files:**

- Create: `tests/diagnostics/onlyoffice-network.test.ts`
- Create: `scripts/diagnostics/onlyoffice-check.sh`

**Step 1: Create diagnostic script**

Create `scripts/diagnostics/onlyoffice-check.sh`:

```bash
#!/bin/bash
set -e

echo "=== OnlyOffice Diagnostic Check ==="
echo ""

# Check 1: Container status
echo "[1/6] Checking container status..."
docker ps -a | grep onlyoffice || echo "WARNING: OnlyOffice container not running"

# Check 2: Network connectivity
echo ""
echo "[2/6] Checking network connectivity..."
docker network ls | grep pm-network || echo "WARNING: pm-network not found"

# Check 3: DNS resolution from container
echo ""
echo "[3/6] Testing DNS resolution from container..."
docker exec pm-onlyoffice nslookup host.docker.internal 2>/dev/null || echo "FAIL: host.docker.internal not resolvable"

# Check 4: Callback URL reachability
echo ""
echo "[4/6] Testing callback URL reachability..."
docker exec pm-onlyoffice curl -s -o /dev/null -w "%{http_code}" http://host.docker.internal:3000/health 2>/dev/null || echo "FAIL: Callback URL not reachable"

# Check 5: File existence
echo ""
echo "[5/6] Checking sample file existence..."
# Add file check logic here

# Check 6: Environment variables
echo ""
echo "[6/6] Checking environment variables..."
docker exec pm-onlyoffice env | grep -E "(ONLYOFFICE|CALLBACK)" || echo "WARNING: No relevant env vars in container"

echo ""
echo "=== Diagnostic Complete ==="
```

Run:

```bash
chmod +x scripts/diagnostics/onlyoffice-check.sh
```

**Step 2: Create unit test for network diagnostics**

Create `tests/diagnostics/onlyoffice-network.test.ts`:

```typescript
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

describe('OnlyOffice Network Diagnostics', () => {
  const envFilePath = path.join(process.cwd(), '.env')

  test('environment file exists', () => {
    expect(fs.existsSync(envFilePath)).toBe(true)
  })

  test('ONLYOFFICE_CALLBACK_URL is configured', () => {
    const envContent = fs.readFileSync(envFilePath, 'utf-8')
    const match = envContent.match(/ONLYOFFICE_CALLBACK_URL=(.+)/)
    expect(match).toBeTruthy()

    const callbackUrl = match![1].replace(/"/g, '').trim()
    expect(callbackUrl).toBeTruthy()
  })

  test('ONLYOFFICE_CALLBACK_URL uses host.docker.internal on Linux', () => {
    const envContent = fs.readFileSync(envFilePath, 'utf-8')
    const match = envContent.match(/ONLYOFFICE_CALLBACK_URL=(.+)/)

    if (process.platform === 'linux') {
      const callbackUrl = match![1].replace(/"/g, '').trim()
      // Should use host.docker.internal, not hardcoded IP
      expect(callbackUrl).toContain('host.docker.internal')
    }
  })

  test('docker-compose.onlyoffice.yml configures extra_hosts', () => {
    const dockerComposePath = path.join(process.cwd(), 'docker-compose.onlyoffice.yml')
    const content = fs.readFileSync(dockerComposePath, 'utf-8')

    expect(content).toContain('extra_hosts')
    expect(content).toContain('host.docker.internal')
  })
})
```

**Step 3: Run diagnostic tests**

Run:

```bash
npm test -- tests/diagnostics/onlyoffice-network.test.ts
```

Expected: Tests run, may fail if configuration is incorrect

**Step 4: Commit test framework**

Run:

```bash
git add scripts/diagnostics/ tests/diagnostics/
git commit -m "test: add OnlyOffice diagnostic test framework"
```

---

## Phase 1: P0 Diagnostics (Highest Probability)

### Task 1.1: Verify Docker Network Configuration

**Files:**

- Modify: `docker-compose.onlyoffice.yml`
- Test: `tests/diagnostics/onlyoffice-network.test.ts`

**Step 1: Read current network configuration**

Run:

```bash
cat docker-compose.onlyoffice.yml
```

**Step 2: Verify network configuration includes host.docker.internal**

Expected configuration:

```yaml
services:
  onlyoffice:
    image: onlyoffice/documentserver:latest
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    networks:
      - pm-network

networks:
  pm-network:
    external: true
    name: pm-network
```

**Step 3: Create fix if needed**

If `extra_hosts` is missing, modify:

```yaml
services:
  onlyoffice:
    # ... existing config ...
    extra_hosts:
      - 'host.docker.internal:host-gateway'
```

**Step 4: Test network configuration**

Run:

```bash
docker-compose -f docker-compose.onlyoffice.yml config
```

Expected: Valid YAML configuration output

**Step 5: Commit network fix**

Run:

```bash
git add docker-compose.onlyoffice.yml
git commit -m "fix: add host.docker.internal to OnlyOffice extra_hosts"
```

---

### Task 1.2: Fix Environment Variable Configuration

**Files:**

- Modify: `.env`
- Test: `tests/diagnostics/onlyoffice-network.test.ts`

**Step 1: Read current environment configuration**

Run:

```bash
grep ONLYOFFICE .env
```

**Step 2: Fix callback URL to use host.docker.internal**

Modify `.env`:

```bash
# Before (hardcoded IP)
ONLYOFFICE_CALLBACK_URL="http://172.20.157.10:3000"

# After (portable hostname)
ONLYOFFICE_CALLBACK_URL="http://host.docker.internal:3000"
```

**Step 3: Verify environment variable consistency**

Check that all OnlyOffice URLs are consistent:

```bash
grep -E "ONLYOFFICE.*URL" .env
```

Expected output:

```
ONLYOFFICE_API_URL="http://pm-onlyoffice:80"
NEXT_PUBLIC_ONLYOFFICE_API_URL="http://localhost:8082"
ONLYOFFICE_CALLBACK_URL="http://host.docker.internal:3000"
```

**Step 4: Run unit tests for environment validation**

Run:

```bash
npm test -- tests/diagnostics/onlyoffice-network.test.ts
```

Expected: All tests pass

**Step 5: Commit environment fix**

Run:

```bash
git add .env
git commit -m "fix: use host.docker.internal for callback URL instead of hardcoded IP"
```

---

### Task 1.3: Verify File Physical Existence

**Files:**

- Modify: `src/app/api/v1/files/[id]/download/route.ts`
- Test: `tests/integration/file-preview.test.ts`

**Step 1: Add file existence verification**

Modify download route to add explicit file existence check:

```typescript
import { stat } from 'fs/promises'

// Before returning file, verify it exists
try {
  await stat(filePath)
} catch (error) {
  console.error('File does not exist:', filePath)
  return NextResponse.json({ error: 'File not found', path: filePath }, { status: 404 })
}
```

**Step 2: Add test for file existence check**

Modify `tests/integration/file-preview.test.ts`:

```typescript
test('returns 404 when file does not exist', async () => {
  const response = await GET({ params: { id: 'non-existent-id' } } as any, {
    params: { id: 'non-existent-id' },
  })

  expect(response.status).toBe(404)
  const body = await response.json()
  expect(body.error).toBe('File not found')
})
```

**Step 3: Run file existence tests**

Run:

```bash
npm test -- tests/integration/file-preview.test.ts -t "file does not exist"
```

Expected: Test passes

**Step 4: Commit file existence check**

Run:

```bash
git add src/app/api/v1/files/\[id\]/download/route.ts tests/integration/file-preview.test.ts
git commit -m "feat: add explicit file existence verification before serving"
```

---

### Task 1.4: Verify Environment Variable Consistency in Application

**Files:**

- Modify: `src/lib/preview/onlyoffice.ts`
- Test: `tests/unit/onlyoffice.test.ts`

**Step 1: Check environment variable usage**

Read current implementation:

```bash
cat src/lib/preview/onlyoffice.ts | grep -A2 -B2 "process.env"
```

**Step 2: Add environment variable validation**

Modify `src/lib/preview/onlyoffice.ts`:

```typescript
function getOnlyOfficeConfig() {
  const callbackUrl = process.env.ONLYOFFICE_CALLBACK_URL
  const mockMode = process.env.ONLYOFFICE_MOCK_MODE === 'true'

  if (!mockMode && !callbackUrl) {
    console.error('ONLYOFFICE_CALLBACK_URL is not set')
    throw new Error('OnlyOffice configuration error: MISSING_CALLBACK_URL')
  }

  return {
    callbackUrl: callbackUrl || 'http://localhost:3000',
    mockMode,
    // ... rest of config
  }
}
```

**Step 3: Add unit test for configuration validation**

Modify `tests/unit/onlyoffice.test.ts`:

```typescript
test('throws error when callback URL is missing in non-mock mode', () => {
  delete process.env.ONLYOFFICE_CALLBACK_URL
  process.env.ONLYOFFICE_MOCK_MODE = 'false'

  expect(() => getOnlyOfficeConfig()).toThrow('MISSING_CALLBACK_URL')
})

test('uses default when callback URL is missing in mock mode', () => {
  delete process.env.ONLYOFFICE_CALLBACK_URL
  process.env.ONLYOFFICE_MOCK_MODE = 'true'

  const config = getOnlyOfficeConfig()
  expect(config.callbackUrl).toBe('http://localhost:3000')
})
```

**Step 4: Run unit tests**

Run:

```bash
npm test -- tests/unit/onlyoffice.test.ts
```

Expected: All tests pass

**Step 5: Commit configuration validation**

Run:

```bash
git add src/lib/preview/onlyoffice.ts tests/unit/onlyoffice.test.ts
git commit -m "feat: add environment variable validation for OnlyOffice config"
```

---

## Phase 2: P1 Diagnostics (Medium Probability)

### Task 2.1: Verify Cookie Passing

**Files:**

- Modify: `src/components/files/FilePreview.tsx`
- Test: `tests/e2e/debug-preview.spec.ts`

**Step 1: Check current cookie handling**

Read current FilePreview component:

```bash
cat src/components/files/FilePreview.tsx
```

**Step 2: Verify credentials: 'include' is set**

Ensure all fetch calls include credentials:

```typescript
const response = await fetch(previewUrl, {
  method: 'GET',
  credentials: 'include', // Critical for cookie passing
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**Step 3: Add E2E test for cookie passing**

Modify `tests/e2e/debug-preview.spec.ts`:

```typescript
test('cookies are passed to preview API', async ({ page, context }) => {
  // Login first
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to preview
  await page.goto('/files/test-file-id/preview')

  // Check if preview loads without auth error
  await page.waitForSelector('.preview-container', { timeout: 10000 })

  // Verify no 401 errors in network tab
  const consoleMessages: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text())
    }
  })

  expect(consoleMessages.some((m) => m.includes('401'))).toBe(false)
})
```

**Step 4: Run E2E test**

Run:

```bash
npm run test:e2e -- tests/e2e/debug-preview.spec.ts -t "cookies are passed"
```

Expected: Test passes

**Step 5: Commit cookie fix**

Run:

```bash
git add src/components/files/FilePreview.tsx tests/e2e/debug-preview.spec.ts
git commit -m "fix: ensure credentials: include is set for preview API calls"
```

---

### Task 2.2: Verify File Path Safety Validation

**Files:**

- Modify: `src/lib/file-security.ts`
- Test: `tests/unit/file-security.test.ts`

**Step 1: Review current path security implementation**

Run:

```bash
cat src/lib/file-security.ts
```

**Step 2: Add path traversal prevention test**

Create or modify `tests/unit/file-security.test.ts`:

```typescript
import { validateFilePath } from '../../src/lib/file-security'

describe('File Security', () => {
  test('rejects paths with traversal sequences', () => {
    expect(validateFilePath('/files/../../../etc/passwd')).toBe(false)
    expect(validateFilePath('/files/%2e%2e/secret')).toBe(false)
  })

  test('rejects absolute paths outside base directory', () => {
    expect(validateFilePath('/etc/passwd')).toBe(false)
    expect(validateFilePath('/tmp/malicious')).toBe(false)
  })

  test('accepts valid relative paths', () => {
    expect(validateFilePath('/files/valid-file.pdf')).toBe(true)
    expect(validateFilePath('/documents/report.docx')).toBe(true)
  })
})
```

**Step 3: Run security tests**

Run:

```bash
npm test -- tests/unit/file-security.test.ts
```

Expected: All security tests pass

**Step 4: Commit security validation**

Run:

```bash
git add src/lib/file-security.ts tests/unit/file-security.test.ts
git commit -m "test: add comprehensive path traversal prevention tests"
```

---

### Task 2.3: Verify documentKey Cache Handling

**Files:**

- Modify: `src/lib/document-lock.ts`
- Test: `tests/unit/onlyoffice.test.ts`

**Step 1: Review documentKey generation**

Run:

```bash
cat src/lib/document-lock.ts | grep -A10 "documentKey"
```

**Step 2: Add cache invalidation test**

Modify `tests/unit/onlyoffice.test.ts`:

```typescript
test('generates unique documentKey per file version', () => {
  const file1 = { id: '1', updated_at: '2024-01-01' }
  const file2 = { id: '1', updated_at: '2024-01-02' }

  const key1 = generateDocumentKey(file1)
  const key2 = generateDocumentKey(file2)

  expect(key1).not.toBe(key2)
})

test('documentKey includes timestamp to prevent caching', () => {
  const file = { id: '1', updated_at: '2024-01-01' }
  const key = generateDocumentKey(file)

  // Key should contain timestamp or version info
  expect(key).toMatch(/\d{4}-\d{2}-\d{2}/)
})
```

**Step 3: Run documentKey tests**

Run:

```bash
npm test -- tests/unit/onlyoffice.test.ts -t "documentKey"
```

Expected: All documentKey tests pass

**Step 4: Commit documentKey fix**

Run:

```bash
git add src/lib/document-lock.ts tests/unit/onlyoffice.test.ts
git commit -m "fix: ensure documentKey includes timestamp to prevent stale cache"
```

---

## Phase 3: Integration Testing

### Task 3.1: Run Full Integration Test Suite

**Files:**

- Test: `tests/integration/file-preview.test.ts`
- Test: `tests/integration/database/preview-service.integration.test.ts`

**Step 1: Run all integration tests**

Run:

```bash
npm test -- tests/integration/
```

Expected: All integration tests pass

**Step 2: Document any failures**

If tests fail, create `docs/diagnostics/integration-failures.md`:

```markdown
# Integration Test Failures

## Test Name: [name]

- Error: [error message]
- Root Cause: [analysis]
- Fix: [solution]
```

**Step 3: Commit integration test results**

Run:

```bash
git add docs/diagnostics/integration-failures.md 2>/dev/null || true
git commit -m "test: run full integration test suite for OnlyOffice fixes"
```

---

### Task 3.2: Run E2E Preview Test

**Files:**

- Test: `tests/e2e/debug-preview.spec.ts`

**Step 1: Start test environment**

Run:

```bash
docker-compose -f docker-compose.yml -f docker-compose.onlyoffice.yml up -d
```

Expected: Containers start successfully

**Step 2: Run E2E preview test**

Run:

```bash
npm run test:e2e -- tests/e2e/debug-preview.spec.ts
```

Expected: All E2E tests pass

**Step 3: Capture test results**

Run:

```bash
npm run test:e2e -- tests/e2e/debug-preview.spec.ts --reporter=json > test-results.json
```

**Step 4: Commit E2E results**

Run:

```bash
git add test-results.json
git commit -m "test: run E2E preview tests and capture results"
```

---

## Phase 4: Verification and Documentation

### Task 4.1: Create Verification Checklist

**Files:**

- Create: `docs/diagnostics/verification-checklist.md`

**Step 1: Create comprehensive checklist**

Create `docs/diagnostics/verification-checklist.md`:

```markdown
# OnlyOffice Preview Fix Verification Checklist

## Network Verification

- [ ] `host.docker.internal` resolves from OnlyOffice container
- [ ] Callback URL is reachable from OnlyOffice container
- [ ] Network `pm-network` exists and containers are connected

## File Verification

- [ ] Sample file exists in storage directory
- [ ] File is readable by application
- [ ] File path validation passes

## Configuration Verification

- [ ] ONLYOFFICE_CALLBACK_URL uses host.docker.internal
- [ ] ONLYOFFICE_API_URL points to correct container
- [ ] JWT settings are consistent

## Functional Verification

- [ ] File preview loads without error
- [ ] File editing works
- [ ] Callback saves changes correctly
- [ ] No authentication errors in logs

## Test Verification

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
```

**Step 2: Run verification checklist**

Execute each check and mark results:

```bash
# Run diagnostic script
./scripts/diagnostics/onlyoffice-check.sh
```

**Step 3: Commit verification checklist**

Run:

```bash
git add docs/diagnostics/verification-checklist.md
git commit -m "docs: add OnlyOffice fix verification checklist"
```

---

### Task 4.2: Create Final Report

**Files:**

- Create: `docs/diagnostics/onlyoffice-root-cause-report.md`

**Step 1: Document root cause findings**

Create `docs/diagnostics/onlyoffice-root-cause-report.md`:

````markdown
# OnlyOffice Preview Failure - Root Cause Report

## Executive Summary

**Root Cause Identified:** [Description of actual root cause]

**Fix Applied:** [Description of fix]

**Verification Status:** [Verified/Unverified]

## Problem Description

- **Symptom:** OnlyOffice displays "打开附件时出现错误"
- **Environment:** Docker deployment on Linux
- **Impact:** Users cannot preview review materials

## Root Cause Analysis

### Primary Cause

[Detailed description of the primary root cause]

**Evidence:**

- [Evidence 1]
- [Evidence 2]

### Contributing Factors

[List any contributing factors]

## Fix Implementation

### Changes Made

1. **File: `.env`**
   - Changed: `ONLYOFFICE_CALLBACK_URL` from hardcoded IP to `host.docker.internal`
   - Commit: [commit hash]

2. **File: `docker-compose.onlyoffice.yml`**
   - Added: `extra_hosts` configuration for `host.docker.internal`
   - Commit: [commit hash]

3. **File: `src/lib/preview/onlyoffice.ts`**
   - Added: Environment variable validation
   - Commit: [commit hash]

### Tests Added

1. `tests/diagnostics/onlyoffice-network.test.ts` - Network configuration tests
2. `tests/unit/onlyoffice.test.ts` - Enhanced unit tests
3. `tests/e2e/debug-preview.spec.ts` - E2E preview tests

## Verification Results

### Before Fix

- Diagnostic script: FAILED
- Unit tests: [X] failing
- E2E tests: FAILED

### After Fix

- Diagnostic script: PASSED
- Unit tests: All passing
- E2E tests: All passing

## Lessons Learned

1. [Lesson 1]
2. [Lesson 2]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Appendix

### Commands Used

```bash
# List diagnostic commands
```
````

### Related Files

- `docker-compose.onlyoffice.yml`
- `.env`
- `src/lib/preview/onlyoffice.ts`

````

**Step 2: Commit final report**

Run:
```bash
git add docs/diagnostics/onlyoffice-root-cause-report.md
git commit -m "docs: create comprehensive root cause analysis report"
````

---

### Task 4.3: Merge Fix Branch

**Files:**

- Git operations

**Step 1: Verify all tests pass**

Run:

```bash
npm test
npm run test:e2e
```

Expected: All tests pass

**Step 2: Push branch to remote**

Run:

```bash
git push -u origin fix/onlyoffice-preview-diagnostics
```

**Step 3: Create pull request**

Document PR creation:

```markdown
## PR: Fix OnlyOffice Preview Failure

### Summary

Fixes the "Error opening attachment" issue in OnlyOffice preview.

### Root Cause

`host.docker.internal` was not properly configured for Linux Docker environment.

### Changes

- Fixed callback URL configuration
- Added network diagnostics
- Added comprehensive test coverage

### Testing

- [x] Unit tests pass
- [x] Integration tests pass
- [x] E2E tests pass
```

**Step 4: Merge after review**

Run (after approval):

```bash
git checkout main
git merge fix/onlyoffice-preview-diagnostics
git push origin main
```

---

## Decision Tree

```
START: Preview Failure Reported
│
├─► Run Diagnostic Script (Task 0.3)
│   │
│   ├─► host.docker.internal NOT resolvable?
│   │   └─► Apply Network Fix (Task 1.1, 1.2) → Verify → Continue
│   │
│   ├─► Callback URL unreachable?
│   │   └─► Fix Environment Variables (Task 1.2) → Verify → Continue
│   │
│   └─► File not found?
│       └─► Add File Existence Check (Task 1.3) → Verify → Continue
│
├─► Run Unit Tests (Task 1.4, 2.1, 2.2, 2.3)
│   │
│   ├─► Cookie tests failing?
│   │   └─► Fix credentials: 'include' (Task 2.1) → Verify
│   │
│   ├─► Security tests failing?
│   │   └─► Fix path validation (Task 2.2) → Verify
│   │
│   └─► documentKey tests failing?
│       └─► Fix cache handling (Task 2.3) → Verify
│
├─► Run Integration Tests (Task 3.1)
│   │
│   └─► Tests failing?
│       └─► Debug and fix → Re-run tests
│
├─► Run E2E Tests (Task 3.2)
│   │
│   └─► Tests failing?
│       └─► Debug and fix → Re-run tests
│
└─► All Tests Pass?
    │
    ├─► YES → Create Report (Task 4.2) → Merge (Task 4.3) → DONE
    │
    └─► NO → Return to diagnostic phase
```

---

## Time Estimates

| Phase     | Task                        | Estimated Time | Dependencies |
| --------- | --------------------------- | -------------- | ------------ |
| P0        | Task 0.1-0.3: Preparation   | 30 min         | None         |
| P0        | Task 1.1: Docker Network    | 20 min         | Task 0.3     |
| P0        | Task 1.2: Environment Fix   | 15 min         | Task 1.1     |
| P0        | Task 1.3: File Existence    | 20 min         | Task 1.2     |
| P0        | Task 1.4: Config Validation | 20 min         | Task 1.3     |
| P1        | Task 2.1: Cookie Passing    | 25 min         | Task 1.4     |
| P1        | Task 2.2: Path Security     | 20 min         | Task 2.1     |
| P1        | Task 2.3: documentKey Cache | 20 min         | Task 2.2     |
| P2        | Task 3.1: Integration Tests | 30 min         | Task 2.3     |
| P2        | Task 3.2: E2E Tests         | 30 min         | Task 3.1     |
| P3        | Task 4.1: Verification      | 15 min         | Task 3.2     |
| P3        | Task 4.2: Final Report      | 20 min         | Task 4.1     |
| P3        | Task 4.3: Merge             | 10 min         | Task 4.2     |
| **Total** |                             | **4.5 hours**  |              |

---

## Responsible Party Recommendations

| Role                | Responsibilities                        | Recommended Agent        |
| ------------------- | --------------------------------------- | ------------------------ |
| **Diagnostician**   | Run diagnostic scripts, capture results | `executor` (sonnet)      |
| **Fix Implementer** | Apply code fixes per plan               | `executor` (sonnet)      |
| **Test Writer**     | Write and run tests                     | `test-engineer` (sonnet) |
| **Verifier**        | Run verification checklist              | `verifier` (sonnet)      |
| **Documenter**      | Create final report                     | `writer` (haiku)         |

---

## Risk Assessment

| Risk                                                       | Probability | Impact | Mitigation                                   |
| ---------------------------------------------------------- | ----------- | ------ | -------------------------------------------- |
| `host.docker.internal` doesn't work on target Linux distro | Medium      | High   | Alternative: Use explicit host IP in network |
| Fix breaks existing functionality                          | Low         | Medium | Comprehensive test coverage prevents this    |
| Cookie issues persist after fix                            | Medium      | Medium | E2E tests verify cookie passing              |
| OnlyOffice JWT configuration conflicts                     | Low         | High   | JWT is disabled in current config            |
| File path issues on different OS                           | Low         | Medium | Path security tests cover edge cases         |

---

## Atomic Commit Strategy

Each commit is:

- **Atomic:** Single concern per commit
- **Tested:** Tests included in same commit
- **Reversible:** Can be reverted without breaking build

**Commit Sequence:**

```
1. docs: capture current OnlyOffice configuration baseline
2. test: add OnlyOffice diagnostic test framework
3. fix: add host.docker.internal to OnlyOffice extra_hosts
4. fix: use host.docker.internal for callback URL
5. feat: add explicit file existence verification
6. feat: add environment variable validation
7. fix: ensure credentials: include for preview API
8. test: add path traversal prevention tests
9. fix: ensure documentKey includes timestamp
10. test: run full integration test suite
11. test: run E2E preview tests
12. docs: add verification checklist
13. docs: create root cause analysis report
```

---

## Expected Outputs

1. **Diagnostic Script:** `scripts/diagnostics/onlyoffice-check.sh`
2. **Test Suite:** Enhanced test coverage in `tests/diagnostics/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`
3. **Fixed Configuration:** Updated `.env` and `docker-compose.onlyoffice.yml`
4. **Code Fixes:** Environment validation, file checks, security improvements
5. **Documentation:** Verification checklist and root cause report
6. **Working Preview:** OnlyOffice preview functions correctly

---

## Anti-Patterns to Avoid

❌ **Do NOT** apply all fixes at once - apply and verify incrementally
❌ **Do NOT** skip tests - every fix needs test coverage
❌ **Do NOT** assume root cause - verify with diagnostics
❌ **Do NOT** merge without E2E test passing
❌ **Do NOT** forget to update documentation

✅ **DO** run diagnostics first to confirm hypothesis
✅ **DO** write failing test before fix (TDD)
✅ **DO** commit atomically after each fix
✅ **DO** verify with full test suite before merging
✅ **DO** document findings for future reference

---

## Appendix A: Quick Reference Commands

```bash
# Run full diagnostic
./scripts/diagnostics/onlyoffice-check.sh

# Run only network tests
npm test -- tests/diagnostics/onlyoffice-network.test.ts

# Run OnlyOffice unit tests
npm test -- tests/unit/onlyoffice.test.ts

# Run file preview integration tests
npm test -- tests/integration/file-preview.test.ts

# Run E2E preview tests
npm run test:e2e -- tests/e2e/debug-preview.spec.ts

# Check container logs
docker logs pm-onlyoffice --tail 100

# Test callback URL from container
docker exec pm-onlyoffice curl -v http://host.docker.internal:3000/health

# Verify network connectivity
docker network inspect pm-network
```

---

## Appendix B: Troubleshooting Guide

### Issue: host.docker.internal still not resolving

**Solution 1:** Use explicit host IP

```bash
# Find host IP
ip addr show docker0 | grep "inet " | awk '{print $2}' | cut -d/ -f1

# Update .env
ONLYOFFICE_CALLBACK_URL="http://<host-ip>:3000"
```

**Solution 2:** Use host network mode

```yaml
services:
  onlyoffice:
    network_mode: 'host'
```

### Issue: Callback returns 401 Unauthorized

**Solution:** Check Cookie configuration

```bash
# Verify middleware sets correct cookie path
grep -A5 "cookie" src/middleware.ts

# Ensure credentials: 'include' in fetch calls
grep -r "credentials.*include" src/
```

### Issue: Files not found after upload

**Solution:** Verify file storage path

```bash
# Check FILE_STORAGE_PATH environment variable
grep FILE_STORAGE_PATH .env

# Verify directory exists
ls -la $FILE_STORAGE_PATH
```

---

_Plan created: 2026-03-19_
_Estimated execution time: 4-6 hours_
_Execution mode: ultrawork with TDD verification_
