# P0/P1 功能开发 API 变更记录

## 新增 API 端点

### 里程碑管理 (Milestone)

| 方法   | 路径                            | 说明                                |
| ------ | ------------------------------- | ----------------------------------- |
| GET    | `/api/v1/milestones`            | 获取里程碑列表（支持projectId筛选） |
| POST   | `/api/v1/milestones`            | 创建里程碑                          |
| GET    | `/api/v1/milestones/[id]`       | 获取里程碑详情                      |
| PUT    | `/api/v1/milestones/[id]`       | 更新里程碑                          |
| DELETE | `/api/v1/milestones/[id]`       | 删除里程碑                          |
| GET    | `/api/v1/milestones/[id]/tasks` | 获取里程碑关联的任务                |

### 评审管理 (Review)

| 方法            | 路径                                | 说明                       |
| --------------- | ----------------------------------- | -------------------------- |
| GET             | `/api/v1/reviews`                   | 获取评审列表               |
| POST            | `/api/v1/reviews`                   | 创建评审                   |
| GET             | `/api/v1/reviews/[id]`              | 获取评审详情               |
| PUT             | `/api/v1/reviews/[id]`              | 更新评审                   |
| DELETE          | `/api/v1/reviews/[id]`              | 删除评审                   |
| GET/POST        | `/api/v1/reviews/[id]/materials`    | 评审材料管理               |
| GET/POST/DELETE | `/api/v1/reviews/[id]/participants` | 评审参与者管理             |
| GET             | `/api/v1/review-types`              | 获取评审类型列表           |
| POST            | `/api/v1/review-types/seed`         | 初始化评审类型（系统预设） |

### 任务关联

| 方法 | 路径                            | 说明                                    |
| ---- | ------------------------------- | --------------------------------------- |
| GET  | `/api/v1/tasks?milestoneId=xxx` | 按里程碑筛选任务                        |
| GET  | `/api/v1/tasks?issueId=xxx`     | 按Issue筛选任务                         |
| PUT  | `/api/v1/tasks/[id]/status`     | 更新任务状态（支持milestoneId/issueId） |

**状态翻转逻辑**: 当任务状态变为 DONE 时，关联的 Issue 状态自动变为 RESOLVED。

### 审计日志 (Audit Log)

| 方法 | 路径                       | 说明                   |
| ---- | -------------------------- | ---------------------- |
| GET  | `/api/v1/admin/audit-logs` | 获取审计日志（管理员） |

**支持筛选**: userId, action, entityType, entityId, startDate, endDate

### AI 缓存 (AI Cache)

| 方法   | 路径               | 说明                           |
| ------ | ------------------ | ------------------------------ |
| GET    | `/api/v1/ai/cache` | 获取缓存统计信息               |
| DELETE | `/api/v1/ai/cache` | 清除缓存（支持按key/type/all） |

### Webhook

| 方法   | 路径                               | 说明            |
| ------ | ---------------------------------- | --------------- |
| GET    | `/api/v1/webhooks`                 | 获取Webhook列表 |
| POST   | `/api/v1/webhooks`                 | 创建Webhook     |
| GET    | `/api/v1/webhooks/[id]`            | 获取Webhook详情 |
| PUT    | `/api/v1/webhooks/[id]`            | 更新Webhook     |
| DELETE | `/api/v1/webhooks/[id]`            | 删除Webhook     |
| GET    | `/api/v1/webhooks/[id]/deliveries` | 获取投递记录    |
| POST   | `/api/v1/webhooks/test`            | 测试Webhook     |

### 定时任务 (Scheduled Jobs)

| 方法 | 路径                           | 说明             |
| ---- | ------------------------------ | ---------------- |
| GET  | `/api/v1/admin/scheduled-jobs` | 获取定时任务列表 |

## 新增数据模型

```prisma
// Task 扩展
model Task {
  milestoneId String?
  issueId    String?
  milestone  Milestone? @relation(...)
  issue      Issue?     @relation(...)
}

// 审计日志
model AuditLog {
  id          String      @id
  userId      String
  action      AuditAction
  entityType  String
  entityId    String?
  description String?
  ipAddress   String?
  createdAt   DateTime
}

// AI响应缓存
model AiResponseCache {
  id          String    @id
  cacheKey    String    @unique
  serviceType AIServiceType
  requestHash String
  response    String
  hitCount    Int
  expiresAt   DateTime
}

// Webhook
model Webhook {
  id        String   @id
  name      String
  url       String
  events    String   // JSON array
  secret    String?
  isActive  Boolean
  createdBy String
}

model WebhookDelivery {
  id          String                @id
  webhookId   String
  event       String
  payload     String
  status      WebhookDeliveryStatus
  statusCode  Int?
  response    String?
}

// 定时任务
model ScheduledJob {
  id          String    @id
  name        String    @unique
  cron        String
  endpoint    String
  isActive    Boolean
  lastRunAt   DateTime?
}
```

## 测试文件

- `tests/integration/milestone.test.ts` - 里程碑集成测试
- `tests/integration/review.test.ts` - 评审集成测试
- `tests/e2e/p0-p1-features.spec.ts` - E2E冒烟测试

---

Generated: 2026-02-23
