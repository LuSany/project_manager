# P0/P1 功能开发工作计划

## TL;DR

> **Quick Summary**: 实现剩余未完成的P0（里程碑、评审、任务关联）和P1（审计日志、AI缓存、Webhook、定时任务）功能，采用TDD模式和自底向上的实现顺序。

> **Deliverables**:
>
> - 里程碑管理 API（6个接口）
> - 评审管理 API（6个接口）
> - 任务关联里程碑/Issue 功能
> - 审计日志系统
> - AI响应缓存系统
> - Webhook集成系统
> - 定时任务调度系统
> - 完整的单元测试和集成测试

> **Estimated Effort**: XL
> **Parallel Execution**: YES - 4 Waves
> **Critical Path**: Wave 1 → Wave 2 → Wave 3 → Wave 4

---

## Context

### Original Request

用户要求实现剩余未完成的P0、P1功能开发，包括里程碑管理、评审管理、审计日志、AI缓存、Webhook、定时任务等。

### Interview Summary

**Key Discussions**:

- 开发范围: 全部 P0 + P1
- 测试策略: TDD 模式（RED-GREEN-REFACTOR）
- 实现顺序: 自底向上（数据层 → API层 → 业务逻辑 → 集成验证）

### Metis Review

**Identified Gaps** (addressed):

- 数据迁移策略: 应用Prisma migration
- 删除级联策略: 阻止删除有关联数据的实体
- API错误格式: 使用现有统一响应格式
- 状态翻转规则: 简单的单向翻转逻辑

### Current Codebase State (Verified)

| 功能               | 状态        | 说明                                                     |
| ------------------ | ----------- | -------------------------------------------------------- |
| 里程碑API          | ⚠️ 部分实现 | POST/GET[id]/PUT/DELETE已存在，缺少GET列表和任务关联接口 |
| 评审API            | ❌ 未实现   | 需要创建完整API                                          |
| Task-Milestone关联 | ✅ 已存在   | Task.milestoneId字段已存在于schema                       |
| Task-Issue关联     | ❌ 未实现   | 需要添加issueId字段                                      |
| 审计日志           | ❌ 未实现   | 需要创建模型和API                                        |
| AI缓存             | ❌ 未实现   | 需要创建模型和API                                        |
| Webhook            | ❌ 未实现   | 需要创建模型和API                                        |
| 定时任务           | ❌ 未实现   | 需要创建模型和API                                        |

---

## Work Objectives

### Core Objective

完成P0核心功能和P1增强功能的开发，确保API完整性和测试覆盖率≥80%。

### Concrete Deliverables

- `src/app/api/v1/milestones/*` - 里程碑管理API
- `src/app/api/v1/reviews/*` - 评审管理API
- `src/app/api/v1/admin/audit-logs/*` - 审计日志API
- `src/app/api/v1/ai/cache/*` - AI缓存API
- `src/app/api/v1/webhooks/*` - Webhook API
- `src/app/api/v1/admin/scheduled-jobs/*` - 定时任务API
- `tests/unit/*.test.ts` - 单元测试文件
- `tests/integration/*.test.ts` - 集成测试文件

### Definition of Done

- [ ] 所有API接口可通过curl/Playwright验证
- [ ] 单元测试覆盖率 ≥80%
- [ ] 所有测试通过 (`bun test`)
- [ ] Prisma migration 成功执行

### Must Have

- 里程碑CRUD API
- 评审CRUD API + 材料/参与者管理
- 任务关联里程碑和Issue
- 审计日志记录和查询
- AI响应缓存基础功能
- Webhook发送功能
- 定时任务触发功能

### Must NOT Have (Guardrails)

- AI缓存不实现向量存储或embedding
- Webhook不实现retry机制或签名验证
- 审计日志不记录详细变更内容
- 定时任务不实现分布式锁或可视化面板
- 不扩大任何P1功能的范围

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (vitest)
- **Automated tests**: TDD
- **Framework**: vitest

### TDD Workflow (Each Task)

1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping green

### Agent-Executed QA Scenarios (MANDATORY)

Each task includes API verification via curl:

```
Scenario: API endpoint verification
  Tool: Bash (curl)
  Steps:
    1. Start dev server: bun dev
    2. Send request with auth token
    3. Assert: HTTP status is expected
    4. Assert: Response has correct structure
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Data Layer - Sequential):
├── Task 1: Extend Prisma schema
└── Task 2: Run database migration

Wave 2 (P0 Core Features - Parallel):
├── Task 3: Milestone API + Tests
├── Task 4: Review API + Tests
├── Task 5: Task-Milestone association
└── Task 6: Task-Issue status flip

Wave 3 (P1 Enhanced Features - Parallel):
├── Task 7: Audit Log system
├── Task 8: AI Response Cache
├── Task 9: Webhook integration
└── Task 10: Scheduled Jobs

Wave 4 (Integration & Validation):
├── Task 11: Integration tests
├── Task 12: E2E smoke tests
└── Task 13: Documentation update
```

### Dependency Matrix

| Task | Depends On | Blocks    |
| ---- | ---------- | --------- |
| 1    | None       | 2,3,4,5,6 |
| 2    | 1          | 3,4,5,6   |
| 3    | 2          | 11        |
| 4    | 2          | 11        |
| 5    | 2          | 11        |
| 6    | 2          | 11        |
| 7    | 2          | 11        |
| 8    | 2          | 11        |
| 9    | 2          | 11        |
| 10   | 2          | 11        |
| 11   | 3-10       | 12        |
| 12   | 11         | 13        |
| 13   | 12         | None      |

---

## TODOs

### Wave 1: Data Layer

- [ ] 1. Extend Prisma Schema

  **Current State**:
  - ✅ Task.milestoneId 已存在
  - ❌ Task.issueId 不存在
  - ❌ AuditLog 模型不存在
  - ❌ AiResponseCache 模型不存在
  - ❌ Webhook/WebhookDelivery 模型不存在
  - ❌ ScheduledJob 模型不存在

  **What to do**:
  - Add `issueId` field to Task model (optional, with relation to Issue)
  - Add `tasks` relation to Issue model
  - Add AuditLog model
  - Add AiResponseCache model
  - Add Webhook and WebhookDelivery models
  - Add ScheduledJob model

  **Must NOT do**:
  - Do not modify existing field types
  - Do not remove any existing models or relations
  - Do not add milestoneId to Task (already exists)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: None

  **References**:
  - `prisma/schema.prisma:170-194` - Task model definition
  - `prisma/schema.prisma:436-467` - Issue model definition
  - `docs/TECHNICAL_SPECIFICATION_V4.md:1600-1643` - AiResponseCache spec
  - `docs/TECHNICAL_SPECIFICATION_V4.md:1400-1466` - Email/Audit patterns

  **Acceptance Criteria**:
  - [ ] Task model has issueId field (optional)
  - [ ] Issue model has tasks relation
  - [ ] AuditLog model created with userId, action, entityType, entityId, createdAt
  - [ ] AiResponseCache model created with cacheKey, requestHash, response, expiresAt
  - [ ] Webhook model created with url, events, isActive, secret
  - [ ] WebhookDelivery model created with webhookId, event, status, response
  - [ ] ScheduledJob model created with name, cron, isActive, lastRunAt

  **Commit**: YES
  - Message: `feat(schema): add P0/P1 data models`
  - Files: `prisma/schema.prisma`

- [ ] 2. Run Database Migration

  **What to do**:
  - Run `bunx prisma migrate dev --name add_p0_p1_models`
  - Verify migration succeeded
  - Check database schema updated

  **Must NOT do**:
  - Do not skip migration verification
  - Do not force migration if conflicts exist

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 1

  **References**:
  - `prisma/schema.prisma` - Schema to migrate

  **Acceptance Criteria**:
  - [ ] `bunx prisma migrate dev` succeeds
  - [ ] Migration file created in `prisma/migrations/`
  - [ ] `bunx prisma db push` syncs schema

  **Agent-Executed QA**:

  ```
  Scenario: Verify migration applied
    Tool: Bash
    Steps:
      1. bunx prisma migrate status
      2. Assert: "Database schema is up to date"
  ```

  **Commit**: NO (migration auto-commits)

---

### Wave 2: P0 Core Features

- [ ] 3. Milestone Management API (补全) + Tests

  **Current State**: 里程碑API已部分实现
  - ✅ `POST /api/v1/milestones` - 创建里程碑（已存在）
  - ✅ `GET /api/v1/milestones/[id]` - 获取详情（已存在）
  - ✅ `PUT /api/v1/milestones/[id]` - 更新（已存在）
  - ✅ `DELETE /api/v1/milestones/[id]` - 删除（已存在）
  - ❌ `GET /api/v1/milestones` - 列表接口（需实现）
  - ❌ `GET /api/v1/milestones/[id]/tasks` - 关联任务（需实现）

  **What to do**:
  - 创建测试文件: `tests/unit/milestone.test.ts` (RED first)
  - 实现 `GET /api/v1/milestones` - 列表接口，支持projectId筛选和分页
  - 实现 `GET /api/v1/milestones/[id]/tasks` - 获取里程碑关联的任务
  - 补充现有API的测试用例

  **Must NOT do**:
  - Do not rewrite existing API code
  - Do not modify existing schema (milestoneId already exists)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4,5,6)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `src/app/api/v1/milestones/route.ts` - 现有实现（只有POST）
  - `src/app/api/v1/milestones/[id]/route.ts` - 现有实现（GET/PUT/DELETE）
  - `prisma/schema.prisma:121-145` - Milestone model
  - `prisma/schema.prisma:170-194` - Task model (已有milestoneId字段)

  **Acceptance Criteria**:
  - [ ] Test file created with failing tests first
  - [ ] `bun test tests/unit/milestone.test.ts` → PASS
  - [ ] GET /api/v1/milestones returns paginated list with projectId filter
  - [ ] GET /api/v1/milestones/[id]/tasks returns related tasks

  **Agent-Executed QA**:

  ```
  Scenario: List milestones by project
    Tool: Bash (curl)
    Steps:
      1. GET /api/v1/milestones?projectId=xxx
      2. Assert: status 200, response.data is array
      3. GET /api/v1/milestones/{id}/tasks
      4. Assert: status 200, tasks array returned
  ```

  **Commit**: YES
  - Message: `feat(api): add milestone list and tasks endpoints`
  - Files: `src/app/api/v1/milestones/route.ts`, `src/app/api/v1/milestones/[id]/tasks/route.ts`, `tests/unit/milestone.test.ts`

- [ ] 4. Review Management API + Tests

  **What to do**:
  - Create test file: `tests/unit/review.test.ts` (RED first)
  - Implement `GET /api/v1/reviews` - list with filters
  - Implement `POST /api/v1/reviews` - create
  - Implement `GET /api/v1/reviews/[id]` - detail with materials/participants
  - Implement `PUT /api/v1/reviews/[id]` - update
  - Implement `DELETE /api/v1/reviews/[id]` - delete (cascade materials)
  - Implement `GET/POST /api/v1/reviews/[id]/materials` - material management
  - Implement `GET/POST/DELETE /api/v1/reviews/[id]/participants` - participant management
  - Seed review type configs (FEASIBILITY, MILESTONE, etc.)

  **Must NOT do**:
  - Do not implement AI review scoring (P2 feature)
  - Do not implement review templates (separate feature)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3,5,6)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `prisma/schema.prisma:473-572` - Review models
  - `docs/TECHNICAL_SPECIFICATION_V4.md:953-1130` - Review management spec

  **Acceptance Criteria**:
  - [ ] Test file created with failing tests first
  - [ ] `bun test tests/unit/review.test.ts` → PASS
  - [ ] All 6 review types seeded in database
  - [ ] Materials can be uploaded and listed
  - [ ] Participants can be added/removed

  **Commit**: YES
  - Message: `feat(api): add review management API`
  - Files: `src/app/api/v1/reviews/*`, `tests/unit/review.test.ts`

- [ ] 5. Task-Milestone Association (已实现，需补充API)

  **Current State**: Task.milestoneId 字段已在 schema 中定义，关系已建立

  **What to do**:
  - 创建测试文件: `tests/unit/task-milestone.test.ts`
  - 更新 Task API 的创建/更新接口，接受 milestoneId 参数
  - 添加验证: milestone 必须属于同一项目
  - 添加筛选: `GET /api/v1/tasks?milestoneId=xxx`

  **Must NOT do**:
  - Do not auto-update milestone progress based on tasks
  - Do not modify schema (already correct)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3,4,6)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `src/app/api/v1/tasks/route.ts` - 现有任务API
  - `prisma/schema.prisma:170-194` - Task model (已有milestoneId)

  **Acceptance Criteria**:
  - [ ] Task can be assigned to a milestone via API
  - [ ] Tasks can be filtered by milestoneId
  - [ ] Validation prevents cross-project assignment

  **Commit**: YES
  - Message: `feat(api): add task-milestone association support`

- [ ] 6. Task-Issue Status Flip

  **What to do**:
  - Create test file: `tests/unit/task-issue.test.ts`
  - Update Task API to accept issueId
  - Implement: When task status → DONE, linked issue status → RESOLVED
  - Add endpoint: `GET /api/v1/tasks?issueId=xxx`

  **Must NOT do**:
  - Do not implement bidirectional sync
  - Do not implement multiple flip rules

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3,4,5)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `src/app/api/v1/tasks/[id]/status/route.ts` - Status update endpoint
  - `prisma/schema.prisma:436-467` - Issue model

  **Acceptance Criteria**:
  - [ ] Task can be linked to an issue
  - [ ] Task completion triggers issue resolution
  - [ ] Tasks can be filtered by issueId

  **Commit**: YES
  - Message: `feat(api): add task-issue status flip logic`

---

### Wave 3: P1 Enhanced Features

- [ ] 7. Audit Log System

  **What to do**:
  - Create test file: `tests/unit/audit-log.test.ts`
  - Create audit middleware to capture operations
  - Implement `GET /api/v1/admin/audit-logs` - paginated list with filters
  - Implement `GET /api/v1/admin/audit-logs/export` - CSV export
  - Log: userId, action, entityType, entityId, timestamp (only)

  **Must NOT do**:
  - Do not log detailed change content
  - Do not implement real-time streaming

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8,9,10)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Task 2

  **References**:
  - `docs/TECHNICAL_SPECIFICATION_V4.md:4833-4859` - Audit action types

  **Acceptance Criteria**:
  - [ ] Audit log records CREATE/UPDATE/DELETE operations
  - [ ] Admin can query logs with filters
  - [ ] Export generates valid CSV

  **Commit**: YES
  - Message: `feat(api): add audit log system`

- [ ] 8. AI Response Cache

  **What to do**:
  - Create test file: `tests/unit/ai-cache.test.ts`
  - Implement cache key generation (SHA256 of prompt + context)
  - Implement `GET /api/v1/ai/cache` - cache stats
  - Implement `DELETE /api/v1/ai/cache/clear` - clear all
  - Integrate cache check in existing AI service
  - Set TTL: 24 hours

  **Must NOT do**:
  - Do not implement vector embeddings
  - Do not implement cache warming

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7,9,10)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Task 2

  **References**:
  - `src/services/ai.ts` - Existing AI service
  - `docs/TECHNICAL_SPECIFICATION_V4.md:1629-1643` - Cache model spec

  **Acceptance Criteria**:
  - [ ] Cache hit returns stored response
  - [ ] Cache miss triggers AI call and stores result
  - [ ] Clear endpoint removes all cache entries

  **Commit**: YES
  - Message: `feat(api): add AI response cache`

- [ ] 9. Webhook Integration

  **What to do**:
  - Create test file: `tests/unit/webhook.test.ts`
  - Implement `GET/POST /api/v1/webhooks` - CRUD
  - Implement webhook trigger service
  - Trigger events: REVIEW_CREATED, REVIEW_COMPLETED, RISK_ALERT, TASK_COMPLETED
  - Log delivery status in WebhookDelivery

  **Must NOT do**:
  - Do not implement retry mechanism
  - Do not implement signature verification
  - Do not implement webhook UI

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7,8,10)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Task 2

  **References**:
  - `docs/TECHNICAL_SPECIFICATION_V4.md:1856-1865` - Webhook architecture

  **Acceptance Criteria**:
  - [ ] Webhooks can be registered with event types
  - [ ] Events trigger POST to webhook URL
  - [ ] Delivery status is logged

  **Commit**: YES
  - Message: `feat(api): add webhook integration`

- [ ] 10. Scheduled Jobs

  **What to do**:
  - Create test file: `tests/unit/scheduler.test.ts`
  - Implement job scheduler using node-cron or similar
  - Implement `GET /api/v1/admin/scheduled-jobs` - list jobs
  - Implement `POST /api/v1/admin/scheduled-jobs/[id]/run` - manual trigger
  - Add job: Daily risk scan (trigger AI risk assessment for active projects)

  **Must NOT do**:
  - Do not implement distributed locks
  - Do not implement visual scheduling panel
  - Do not add more than 3 scheduled jobs

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7,8,9)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Task 2

  **References**:
  - `docs/TECHNICAL_SPECIFICATION_V4.md:1509-1561` - Risk assessment trigger
  - `src/services/ai.ts` - AI risk analysis

  **Acceptance Criteria**:
  - [ ] Risk scan job runs daily at 2 AM
  - [ ] Jobs can be enabled/disabled
  - [ ] Manual trigger executes immediately

  **Commit**: YES
  - Message: `feat(api): add scheduled jobs system`

---

### Wave 4: Integration & Validation

- [ ] 11. Integration Tests

  **What to do**:
  - Create `tests/integration/milestone-api.test.ts`
  - Create `tests/integration/review-api.test.ts`
  - Create `tests/integration/webhook-flow.test.ts`
  - Test full request/response cycles
  - Test error scenarios

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Tasks 3-10

  **Acceptance Criteria**:
  - [ ] All integration tests pass
  - [ ] Coverage includes happy path and error cases

  **Commit**: YES
  - Message: `test: add integration tests for P0/P1 features`

- [ ] 12. E2E Smoke Tests

  **What to do**:
  - Create `tests/e2e/milestone-flow.spec.ts` (Playwright)
  - Create `tests/e2e/review-flow.spec.ts` (Playwright)
  - Test: Create → Update → Delete flows
  - Capture screenshots

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 11

  **Acceptance Criteria**:
  - [ ] E2E tests pass with screenshots
  - [ ] Core flows verified

  **Commit**: YES
  - Message: `test: add E2E smoke tests`

- [ ] 13. Documentation Update

  **What to do**:
  - Update API documentation
  - Update README with new features
  - Add migration guide for existing deployments

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 12

  **Acceptance Criteria**:
  - [ ] API endpoints documented
  - [ ] README updated

  **Commit**: YES
  - Message: `docs: update documentation for P0/P1 features`

---

## Commit Strategy

| After Task | Message                                     | Files                                  |
| ---------- | ------------------------------------------- | -------------------------------------- |
| 1          | `feat(schema): add P0/P1 data models`       | prisma/schema.prisma                   |
| 3          | `feat(api): add milestone management API`   | src/app/api/v1/milestones/_, tests/_   |
| 4          | `feat(api): add review management API`      | src/app/api/v1/reviews/_, tests/_      |
| 5          | `feat(api): add task-milestone association` | src/app/api/v1/tasks/\*                |
| 6          | `feat(api): add task-issue status flip`     | src/app/api/v1/tasks/\*                |
| 7          | `feat(api): add audit log system`           | src/app/api/v1/admin/audit-logs/\*     |
| 8          | `feat(api): add AI response cache`          | src/app/api/v1/ai/cache/\*             |
| 9          | `feat(api): add webhook integration`        | src/app/api/v1/webhooks/\*             |
| 10         | `feat(api): add scheduled jobs system`      | src/app/api/v1/admin/scheduled-jobs/\* |
| 11         | `test: add integration tests`               | tests/integration/\*                   |
| 12         | `test: add E2E smoke tests`                 | tests/e2e/\*                           |
| 13         | `docs: update documentation`                | README.md, docs/\*                     |

---

## Success Criteria

### Verification Commands

```bash
bun test                    # All tests pass
bunx prisma migrate status  # Database up to date
bun run build               # Build succeeds
```

### Final Checklist

- [ ] All P0 features implemented and tested
- [ ] All P1 features implemented and tested
- [ ] Unit test coverage ≥80%
- [ ] Integration tests pass
- [ ] E2E smoke tests pass
- [ ] Documentation updated
