# 技术方案澄清问卷 - 答复

> 基于 `FINAL_TECHNICAL_SPECIFICATION.md` 技术方案的澄清问题答复

**答复日期：** 2024年
**技术规范版本：** Final V2.0

---

## 一、AI服务相关 ⚠️

### 1.1 AI服务SDK (`z-ai-web-dev-sdk`)

**问题：** 技术栈中提到的 `z-ai-web-dev-sdk` 具体是指什么服务？

| 子问题 | 说明 | 答复 |
|--------|------|------|
| SDK来源 | 请明确SDK的提供方 | ☑ 公司内部自研（通过统一AI网关封装） |
| API文档 | 开发时需要参考的API文档位置 | `/docs/AI_SERVICE_API.md` 或内部Wiki |
| 认证方式 | SDK的认证配置方式 | ☑ API Key（通过环境变量 `AI_API_KEY` 配置） |
| 调用限制 | 是否有频率限制、配额限制？ | ☑ 有限制，详见6.4节速率限制配置：AI接口 30次/分钟 |

**补充说明：**
```typescript
// SDK配置示例
const aiConfig = {
  apiKey: process.env.AI_API_KEY,
  baseUrl: process.env.AI_BASE_URL,  // 可选，用于指定AI网关地址
  model: process.env.AI_MODEL || 'gpt-4',  // 默认模型
}

// 支持的AI服务类型
type AIServiceType = 
  | 'RISK_ANALYSIS'    // 风险分析
  | 'REVIEW_AUDIT'     // 评审审核
  | 'DOC_PARSE'        // 文档解析
```

---

### 1.2 AI风险评估触发机制

**问题：** AI风险评估服务的触发时机和频率如何定义？

| 子问题 | 答复内容 |
|--------|----------|
| 定时扫描周期 | **每天凌晨2点**执行全量项目风险扫描，可配置 |
| 实时触发延迟 | 里程碑任务变更后**延迟5分钟**触发（避免频繁调用），允许配置为立即触发 |
| 风险级别判定 | 基于AI返回的风险分数映射：<br>• 0-30: LOW（低）<br>• 31-60: MEDIUM（中）<br>• 61-85: HIGH（高）<br>• 86-100: CRITICAL（关键） |
| 预警发送机制 | 发送对象：项目经理、项目Owner、风险管理人<br>发送方式：站内通知 + 邮件（如已配置） |

**补充代码定义：**
```typescript
// 风险评估触发配置
const riskAssessmentConfig = {
  // 定时扫描
  scheduledScan: {
    enabled: true,
    cron: '0 2 * * *',  // 每天凌晨2点
  },
  
  // 实时触发
  realTimeTrigger: {
    enabled: true,
    delayMs: 5 * 60 * 1000,  // 5分钟延迟
    debounce: true,          // 防抖处理
  },
  
  // 风险级别阈值
  riskLevelThresholds: {
    LOW: { min: 0, max: 30 },
    MEDIUM: { min: 31, max: 60 },
    HIGH: { min: 61, max: 85 },
    CRITICAL: { min: 86, max: 100 },
  },
  
  // 预警通知
  alertNotification: {
    channels: ['in-app', 'email'],
    recipients: ['project_manager', 'project_owner', 'risk_owner'],
  },
}
```

---

### 1.3 AI审核评分标准

**问题：** 评审材料的AI审核三项评分的具体标准是什么？

| 评分项 | 评分标准 |
|--------|----------|
| `aiContentScore` | 内容完整性评分（0-100）：<br>• 检查必填材料是否齐全<br>• 检查内容字数是否符合要求<br>• **60分及以上为合格** |
| `aiLogicScore` | 逻辑合理性评分（0-100）：<br>• 检查文档结构是否合理<br>• 检查数据/图表是否一致<br>• 检查论据是否支持结论<br>• **60分及以上为合格** |
| `aiRiskScore` | 风险识别评分（0-100）：<br>• 识别潜在风险点<br>• 评估风险影响程度<br>• **分数越高表示风险越大，70分以上需关注** |
| 综合判定 | 通过条件：<br>• `aiContentScore >= 60` AND<br>• `aiLogicScore >= 60` AND<br>• `aiRiskScore < 70` |

**补充说明：**
```typescript
// AI审核判定逻辑
interface AIReviewResult {
  aiContentScore: number;   // 内容完整性 0-100
  aiLogicScore: number;     // 逻辑合理性 0-100
  aiRiskScore: number;      // 风险评分 0-100（分越高风险越大）
  aiSuggestions: string;    // 改进建议
  aiReviewStatus: 'PASSED' | 'WARNING' | 'FAILED';
}

function evaluateAIReview(scores: AIReviewResult): 'PASSED' | 'WARNING' | 'FAILED' {
  const { aiContentScore, aiLogicScore, aiRiskScore } = scores;
  
  // 完全通过
  if (aiContentScore >= 60 && aiLogicScore >= 60 && aiRiskScore < 60) {
    return 'PASSED';
  }
  
  // 警告（通过但需关注）
  if (aiContentScore >= 60 && aiLogicScore >= 60 && aiRiskScore >= 60 && aiRiskScore < 70) {
    return 'WARNING';
  }
  
  // 不通过
  return 'FAILED';
}
```

---

## 二、文件服务相关 ⚠️

### 2.1 文件存储方案选择

**问题：** 开发环境和生产环境的文件存储方案是什么？

| 环境 | 存储方案 | 配置要求 |
|------|----------|----------|
| 开发环境 | ☑ 本地存储 | 路径：`./uploads/`，通过环境变量 `UPLOAD_DIR` 配置 |
| 生产环境 | ☑ 本地存储为主，可扩展云存储 | 默认本地存储，支持通过配置切换至云存储（阿里云OSS/腾讯云COS） |
| 备份策略 | 文件需要备份 | 每日凌晨增量备份，每周日全量备份 |
| 容量规划 | 预估文件存储容量需求 | **500GB起步**，按项目增长预估年增长100-200GB |

**补充配置：**
```env
# 文件存储配置
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=104857600  # 100MB

# 云存储配置（可选，生产环境）
CLOUD_STORAGE_ENABLED=false
CLOUD_STORAGE_PROVIDER=aliyun  # aliyun / tencent
CLOUD_STORAGE_BUCKET=project-management-files
CLOUD_STORAGE_REGION=cn-hangzhou
CLOUD_STORAGE_ACCESS_KEY=
CLOUD_STORAGE_SECRET_KEY=
```

---

### 2.2 OnlyOffice文档兼容性

**问题：** OnlyOffice服务支持的文档格式和版本范围？

| 格式类型 | 支持情况 | 备注 |
|----------|----------|------|
| Word文档 | ☑ .doc ☑ .docx ☑ 都支持 | 最高支持Office 2021版本格式 |
| Excel表格 | ☑ .xls ☑ .xlsx ☑ 都支持 | 最高支持Office 2021版本格式 |
| PPT演示 | ☑ .ppt ☑ .pptx ☑ 都支持 | 最高支持Office 2021版本格式 |
| 编辑功能 | 是否支持在线编辑？ | ☑ **可编辑**（OnlyOffice Document Server支持） |

**补充说明：**
- OnlyOffice Document Server 8.2 版本支持实时协作编辑
- 同时支持PDF导出功能
- 支持文档版本历史记录

---

### 2.3 预览水印

**问题：** 技术规范中标注为P2的预览水印功能是否需要预留接口？

| 决策 | 说明 |
|------|------|
| ☑ 是，预留接口 | 水印内容规则：`{用户名} - {日期时间} - 内部资料` |

**预留接口设计：**
```typescript
// 水印配置接口
interface WatermarkConfig {
  enabled: boolean;
  content: string;           // 水印内容模板
  fontSize: number;          // 字体大小
  opacity: number;           // 透明度 0-1
  rotation: number;          // 旋转角度
  pattern: 'tile' | 'single'; // 平铺/单个
}

// 默认配置
const defaultWatermark: WatermarkConfig = {
  enabled: true,
  content: '{username} - {datetime} - 内部资料',
  fontSize: 14,
  opacity: 0.15,
  rotation: -30,
  pattern: 'tile',
}

// API预留
// GET /api/v1/files/{id}/preview?watermark=true
```

---

## 三、数据模型相关 ⚠️

### 3.1 缺失的数据模型定义

**问题：** 以下被多处引用但未定义的数据模型，请补充完整定义：

| 模型名 | 引用位置 | 补充定义 |
|--------|----------|----------|
| **Comment** | Task、Review、Requirement | 见下方完整定义 |
| **Attachment** | Task | 见下方完整定义 |
| **Milestone-Task关联方向** | 里程碑管理 | **1:N关系**（一个里程碑包含多个任务，一个任务只能属于一个里程碑） |

### 3.2 Comment模型定义

```prisma
// 评论表 - 支持多态关联
model Comment {
  id          String   @id @default(cuid())
  content     String   // 评论内容
  userId      String   // 评论者ID
  parentId    String?  // 父评论ID（支持回复）
  
  // 多态关联 - 通过 targetType 和 targetId 实现
  targetType  String   // 关联对象类型: TASK, REVIEW, REQUIREMENT
  targetId    String   // 关联对象ID
  
  // 状态
  isEdited    Boolean  @default(false)
  isDeleted   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")
  
  @@index([targetType, targetId])
  @@index([userId])
  @@index([createdAt(sort: Desc)])
}

// 附件表
model Attachment {
  id            String        @id @default(cuid())
  fileName      String        // 原始文件名
  storedName    String        // 存储文件名
  filePath      String        // 文件路径
  fileSize      Int           // 文件大小（字节）
  mimeType      String        // MIME类型
  fileExtension String        // 文件扩展名
  
  // 多态关联
  targetType    String        // 关联对象类型: TASK, COMMENT, REVIEW
  targetId      String        // 关联对象ID
  
  uploadedBy    String        // 上传者ID
  uploadedAt    DateTime      @default(now())
  
  // 关联
  uploader      User          @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  @@index([targetType, targetId])
  @@index([uploadedBy])
}

// Milestone-Task 关联说明
// 一个里程碑(1) 包含 多个任务(N)
// 任务通过 milestoneId 字段关联里程碑
// 任务不可跨里程碑（一个任务只能属于一个里程碑）
```

---

## 四、权限与角色相关 ⚠️

### 4.1 项目管理员与项目所有者权限边界

**问题：** `PROJECT_ADMIN` 和 `PROJECT_OWNER` 的具体权限差异是什么？

| 操作 | PROJECT_ADMIN | PROJECT_OWNER | 说明 |
|------|:-------------:|:-------------:|------|
| 项目成员管理 | ☑ 可 | ☑ 可 | 都可以管理成员，但PROJECT_OWNER可设置PROJECT_MEMBER为PROJECT_OWNER |
| 需求审核 | ☐ 否 | ☑ 可 | 仅PROJECT_OWNER可审核需求 |
| 项目删除 | ☐ 否 | ☑ 可* | PROJECT_OWNER可删除自己Owner的项目，需二次确认 |
| 预算修改 | ☑ 可 | ☑ 可 | 都可修改预算 |
| 角色转换 | ☐ 否 | ☐ 否 | 角色由系统管理员分配，不可自行转换 |

**补充权限矩阵：**
```typescript
const rolePermissions = {
  PROJECT_ADMIN: {
    projects: ['create', 'read', 'update'],
    members: ['read', 'create', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    requirements: ['create', 'read', 'update'],  // 无审核权限
    reviews: ['create', 'read', 'update', 'delete'],
    risks: ['create', 'read', 'update', 'delete'],
  },
  PROJECT_OWNER: {
    projects: ['create', 'read', 'update', 'delete'],  // 含删除权限
    members: ['read', 'create', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    requirements: ['create', 'read', 'update', 'approve'],  // 含审核权限
    reviews: ['create', 'read', 'update', 'delete'],
    risks: ['create', 'read', 'update', 'delete'],
  },
}
```

---

### 4.2 邮件系统管理员权限范围

**问题：** 系统管理员(ADMIN)对邮件服务的权限边界是什么？

| 操作 | 是否允许 | 备注 |
|------|:--------:|------|
| 查看所有邮件配置 | ☑ 是 | 可查看所有邮件服务商配置 |
| 修改邮件配置 | ☑ 是 | 可添加/修改/删除邮件配置 |
| 查看邮件发送日志 | ☑ 是 | 可查看所有邮件发送记录 |
| 是否支持多租户隔离 | ☐ 否 | 当前版本为单租户，多租户为P2功能 |

---

## 五、通知机制相关 ⚠️

### 5.1 通知发送机制

**问题：** 通知系统采用何种技术架构实现？

| 架构选型 | 答复 |
|----------|------|
| ☑ 混合方案 | 重要通知（风险预警、评审邀请）实时发送<br>普通通知（任务提醒、评论通知）定时批量发送 |

**实现方案：**
```typescript
const notificationConfig = {
  // 实时通知类型
  realTimeTypes: [
    'RISK_ALERT',        // 风险预警
    'REVIEW_INVITE',     // 评审邀请
    'URGENT_TASK',       // 紧急任务分配
  ],
  
  // 批量通知类型
  batchTypes: [
    'TASK_DUE_REMINDER', // 任务到期提醒
    'TASK_ASSIGNED',     // 任务分配通知
    'COMMENT_MENTION',   // 评论@提醒
    'DAILY_DIGEST',      // 每日摘要
  ],
  
  // 批量发送配置
  batchSchedule: {
    interval: 5 * 60 * 1000,  // 每5分钟发送一批
    maxBatchSize: 100,         // 每批最多100条
  },
}
```

---

### 5.2 通知订阅粒度

**问题：** 用户的通知偏好设置支持多细粒度的控制？

| 粒度级别 | 支持情况 | 说明 |
|----------|:--------:|------|
| 全局级别 | ☑ 支持 | 开启/关闭所有邮件通知、站内通知 |
| 项目级别 | ☑ 支持 | 选择关注/忽略特定项目的通知 |
| 事件类型级别 | ☑ 支持 | 按事件类型开关（任务、评审、风险等） |
| 具体资源级别 | ☐ 不支持 | 当前版本不支持，考虑P2版本添加 |

**通知偏好数据模型：**
```prisma
model NotificationPreference {
  id              String  @id @default(cuid())
  userId          String  @unique
  
  // 全局设置
  emailEnabled    Boolean @default(true)
  inAppEnabled    Boolean @default(true)
  
  // 事件类型设置
  taskDue         Boolean @default(true)
  taskAssigned    Boolean @default(true)
  reviewInvite    Boolean @default(true)
  riskAlert       Boolean @default(true)
  commentMention  Boolean @default(true)
  
  // 摘要设置
  weeklyDigest    Boolean @default(false)
  dailyDigest     Boolean @default(false)
  
  // 关联
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 项目级别忽略设置
model NotificationIgnore {
  id          String   @id @default(cuid())
  userId      String
  projectId   String
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, projectId])
}
```

---

## 六、API设计相关 ⚠️

### 6.1 完整API清单确认

**问题：** 技术规范6.5节仅列出了部分P0/P1接口，是否需要补充完整的CRUD接口清单？

| 决策 | 答复 |
|------|------|
| ☑ 需要补充 | 为每个模块生成完整API清单，在开发前完成详细设计 |

**完整API清单见附录A（本文档末尾）**

---

### 6.2 URL签名机制

**问题：** 技术规范提到"URL签名机制增强"，具体实现方式是什么？

| 问题 | 答复内容 |
|------|----------|
| 签名算法 | ☑ HMAC-SHA256 |
| 签名有效期 | **1小时**（可配置） |
| 签名参数 | `fileId`、`userId`、`timestamp`、`action`（view/download） |
| 签名传递方式 | ☑ URL参数（主） ☑ Header（备选） |

**实现代码：**
```typescript
import crypto from 'crypto'

interface SignedUrlParams {
  fileId: string
  userId: string
  action: 'view' | 'download'
  expiresIn?: number  // 秒，默认3600
}

function generateSignedUrl(params: SignedUrlParams): string {
  const { fileId, userId, action, expiresIn = 3600 } = params
  const timestamp = Math.floor(Date.now() / 1000)
  const expires = timestamp + expiresIn
  
  // 参与签名的参数
  const signContent = `${fileId}|${userId}|${action}|${expires}`
  
  // 生成签名
  const signature = crypto
    .createHmac('sha256', process.env.FILE_SIGN_SECRET!)
    .update(signContent)
    .digest('hex')
  
  // 返回带签名的URL
  return `/api/v1/files/${fileId}?userId=${userId}&action=${action}&expires=${expires}&sig=${signature}`
}

function verifySignedUrl(
  fileId: string,
  userId: string,
  action: string,
  expires: number,
  signature: string
): boolean {
  // 检查是否过期
  if (Date.now() / 1000 > expires) {
    return false
  }
  
  // 验证签名
  const signContent = `${fileId}|${userId}|${action}|${expires}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FILE_SIGN_SECRET!)
    .update(signContent)
    .digest('hex')
  
  return signature === expectedSignature
}
```

---

## 七、环境配置相关 ⚠️

### 7.1 环境变量命名统一

**问题：** 文档中存在环境变量命名不一致的情况，请确认标准命名：

| 变量用途 | 标准命名确认 |
|----------|--------------|
| KKFileView服务地址 | ☑ `KKFILEVIEW_URL` |
| OnlyOffice JWT Secret | ☑ `ONLYOFFICE_JWT_SECRET` |

**统一环境变量清单：**
```env
# ========== 数据库 ==========
DATABASE_URL="postgresql://user:password@localhost:5432/project_management"

# ========== JWT ==========
JWT_SECRET="your-secure-jwt-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="15m"           # Access Token有效期
JWT_REFRESH_EXPIRES_IN="7d"    # Refresh Token有效期

# ========== OnlyOffice ==========
ONLYOFFICE_URL="http://localhost:8080"
ONLYOFFICE_JWT_SECRET="your-onlyoffice-jwt-secret"
ONLYOFFICE_ENABLED=true

# ========== KKFileView ==========
KKFILEVIEW_URL="http://localhost:8012"
KKFILEVIEW_ENABLED=true

# ========== 文件存储 ==========
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=104857600
FILE_SIGN_SECRET="your-file-signing-secret-key"

# ========== AI服务 ==========
AI_API_KEY="your-ai-api-key"
AI_BASE_URL="https://ai-gateway.example.com"
AI_MODEL="gpt-4"

# ========== 邮件 ==========
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="password"
SMTP_FROM="Project Management <noreply@example.com>"

# ========== 应用 ==========
NEXT_PUBLIC_APP_URL="https://pm.example.com"
NEXT_PUBLIC_APP_NAME="项目管理系统"
```

---

## 八、实施计划相关 ⚠️

### 8.1 测试策略

**问题：** 各开发阶段的测试覆盖要求是什么？

| 测试类型 | 要求说明 | 覆盖率目标 |
|----------|----------|:----------:|
| 单元测试 | ☑ 必须 | 目标覆盖率：**70%** |
| 集成测试 | ☑ 必须 | 关键业务流程必须覆盖（认证、任务创建、需求审核） |
| E2E测试 | ☑ 可选 | 测试框架：**Playwright** |

**测试配置：**
```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

---

### 8.2 阶段验收标准

**问题：** 每个开发阶段（2周/1周）完成的验收标准是什么？

| 验收维度 | 标准 |
|----------|------|
| 功能完成度 | 所有P0功能必须完成，P1功能完成比例：**≥80%** |
| 测试通过率 | 单元测试通过率不低于：**100%** |
| 代码审查 | ☑ 必须（每个PR至少1人审核） |
| 文档更新 | ☑ API文档同步更新 |

**阶段验收清单模板：**
```markdown
## 阶段验收报告

### 基本信息
- 阶段名称：Phase X - XXX模块
- 开发周期：YYYY-MM-DD ~ YYYY-MM-DD
- 开发人员：XXX

### 功能完成情况
| 功能项 | 优先级 | 状态 | 备注 |
|--------|:------:|:----:|------|
| 功能A | P0 | ✅ | |
| 功能B | P1 | ✅ | |
| 功能C | P1 | ⏳ | 待完成 |

### 测试覆盖
- 单元测试覆盖率：XX%
- 集成测试用例数：XX
- E2E测试场景数：XX

### 代码审查
- [ ] 代码已通过Review
- [ ] 无高危安全漏洞
- [ ] 无性能问题告警

### 文档更新
- [ ] API文档已更新
- [ ] 组件文档已更新
- [ ] README已更新

### 验收结论
- [ ] 通过
- [ ] 有条件通过（需补充：XXX）
- [ ] 不通过（原因：XXX）
```

---

## 九、其他问题 ℹ️

### 9.1 文档命名规范

**答复：** 已在 FINAL_TECHNICAL_SPECIFICATION.md 中统一修正，后续文档命名遵循以下规范：
- 文件名使用大写字母+下划线分隔
- 示例：`FINAL_TECHNICAL_SPECIFICATION.md`

---

### 9.2 数据库选型确认

**问题：** 开发环境使用SQLite，生产环境使用PostgreSQL，是否有其他中间环境的数据库需求？

| 环境 | 数据库选型 |
|------|------------|
| 本地开发 | SQLite |
| 测试环境 | ☑ PostgreSQL（与生产环境一致，避免兼容性问题） |
| 预发布环境 | ☑ PostgreSQL |
| 生产环境 | PostgreSQL |

**说明：** 测试环境和预发布环境使用PostgreSQL，以确保与生产环境行为一致。

---

### 9.3 技术栈版本确认

**问题：** 以下技术选型的版本号需要最终确认：

| 技术 | 文档版本 | 当前稳定版本 | 确认使用版本 |
|------|----------|--------------|:------------:|
| Next.js | 16.x | 15.x | ☑ **15.x**（稳定版） |
| React | 19.x | 19.x（Canary） | ☑ **18.x**（稳定版） |
| jose | 6.x | 5.x | ☑ **5.x** |
| date-fns | 4.x | 3.x | ☑ **3.x** |

**修订后技术栈：**
```json
{
  "next": "15.x",
  "react": "18.x",
  "react-dom": "18.x",
  "jose": "5.x",
  "date-fns": "3.x",
  "typescript": "5.x",
  "tailwindcss": "4.x",
  "prisma": "6.x",
  "recharts": "2.x",
  "zod": "4.x",
  "react-hook-form": "7.x",
  "zustand": "5.x",
  "@tanstack/react-query": "5.x"
}
```

---

## 附录A：完整API清单

### A.1 认证模块 API

| 接口 | 方法 | 说明 | 速率限制 |
|------|------|------|:--------:|
| /api/v1/auth/register | POST | 用户注册 | 10/分钟 |
| /api/v1/auth/login | POST | 用户登录 | 10/分钟 |
| /api/v1/auth/logout | POST | 用户登出 | - |
| /api/v1/auth/me | GET | 获取当前用户 | - |
| /api/v1/auth/refresh | POST | 刷新Token | 20/分钟 |
| /api/v1/auth/forgot-password | POST | 请求密码重置 | 5/分钟 |
| /api/v1/auth/reset-password | POST | 重置密码 | 5/分钟 |

### A.2 用户管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/users | GET | 用户列表（管理员） |
| /api/v1/users/:id | GET | 用户详情 |
| /api/v1/users/:id | PUT | 更新用户信息 |
| /api/v1/users/:id | DELETE | 删除用户（管理员） |
| /api/v1/users/:id/avatar | POST | 上传头像 |
| /api/v1/users/:id/password | PUT | 修改密码 |

### A.3 项目管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/projects | GET | 项目列表（分页） |
| /api/v1/projects | POST | 创建项目 |
| /api/v1/projects/:id | GET | 项目详情 |
| /api/v1/projects/:id | PUT | 更新项目 |
| /api/v1/projects/:id | DELETE | 删除项目 |
| /api/v1/projects/:id/members | GET | 项目成员列表 |
| /api/v1/projects/:id/members | POST | 添加成员 |
| /api/v1/projects/:id/members/:userId | PUT | 更新成员角色 |
| /api/v1/projects/:id/members/:userId | DELETE | 移除成员 |
| /api/v1/projects/:id/stats | GET | 项目统计信息 |
| /api/v1/projects/:id/milestones | GET | 里程碑列表 |
| /api/v1/projects/:id/milestones | POST | 创建里程碑 |

### A.4 任务管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/tasks | GET | 任务列表（支持筛选） |
| /api/v1/tasks | POST | 创建任务 |
| /api/v1/tasks/:id | GET | 任务详情 |
| /api/v1/tasks/:id | PUT | 更新任务 |
| /api/v1/tasks/:id | DELETE | 删除任务 |
| /api/v1/tasks/:id/progress | PUT | 更新进度 |
| /api/v1/tasks/:id/status | PUT | 更新状态 |
| /api/v1/tasks/:id/subtasks | GET | 子任务列表 |
| /api/v1/tasks/:id/subtasks | POST | 创建子任务 |
| /api/v1/tasks/:id/subtasks/:subtaskId | PUT | 更新子任务 |
| /api/v1/tasks/:id/subtasks/:subtaskId | DELETE | 删除子任务 |
| /api/v1/tasks/:id/comments | GET | 评论列表 |
| /api/v1/tasks/:id/comments | POST | 添加评论 |
| /api/v1/tasks/:id/attachments | GET | 附件列表 |
| /api/v1/tasks/:id/attachments | POST | 上传附件 |
| /api/v1/tasks/:id/tags | GET | 任务标签 |
| /api/v1/tasks/:id/tags | POST | 添加标签 |
| /api/v1/tasks/:id/tags/:tagId | DELETE | 移除标签 |
| /api/v1/tasks/:id/watch | POST | 关注任务 |
| /api/v1/tasks/:id/unwatch | DELETE | 取消关注 |
| /api/v1/tasks/batch | POST | 批量操作 |

### A.5 需求管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/requirements | GET | 需求列表 |
| /api/v1/requirements | POST | 创建需求 |
| /api/v1/requirements/:id | GET | 需求详情 |
| /api/v1/requirements/:id | PUT | 更新需求 |
| /api/v1/requirements/:id | DELETE | 删除需求 |
| /api/v1/requirements/:id/approve | POST | 审批通过 |
| /api/v1/requirements/:id/reject | POST | 审批拒绝 |
| /api/v1/requirements/:id/proposals | GET | 方案评估列表 |
| /api/v1/requirements/:id/proposals | POST | 提交评估方案 |
| /api/v1/requirements/:id/impacts | GET | 影响分析列表 |
| /api/v1/requirements/:id/impacts | POST | 添加影响分析 |
| /api/v1/requirements/:id/discussions | GET | 讨论记录 |
| /api/v1/requirements/:id/discussions | POST | 添加讨论 |
| /api/v1/requirements/:id/acceptance | POST | 验收 |
| /api/v1/requirements/:id/history | GET | 变更历史 |

### A.6 ISSUE管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/issues | GET | ISSUE列表 |
| /api/v1/issues | POST | 创建ISSUE |
| /api/v1/issues/:id | GET | ISSUE详情 |
| /api/v1/issues/:id | PUT | 更新ISSUE |
| /api/v1/issues/:id | DELETE | 删除ISSUE |
| /api/v1/issues/:id/status | PUT | 更新状态 |
| /api/v1/issues/:id/tasks | GET | 关联任务列表 |
| /api/v1/issues/:id/tasks | POST | 关联任务 |
| /api/v1/issues/:id/tasks/:taskId | DELETE | 取消关联 |

### A.7 风险管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/risks | GET | 风险列表 |
| /api/v1/risks | POST | 创建风险 |
| /api/v1/risks/:id | GET | 风险详情 |
| /api/v1/risks/:id | PUT | 更新风险 |
| /api/v1/risks/:id | DELETE | 删除风险 |
| /api/v1/risks/:id/progress | PUT | 更新进展 |
| /api/v1/risks/:id/tasks | GET | 关联任务列表 |
| /api/v1/risks/:id/tasks | POST | 关联任务 |
| /api/v1/risks/:id/ai-assess | POST | AI风险评估 |

### A.8 评审管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/reviews | GET | 评审列表 |
| /api/v1/reviews | POST | 创建评审 |
| /api/v1/reviews/:id | GET | 评审详情 |
| /api/v1/reviews/:id | PUT | 更新评审 |
| /api/v1/reviews/:id | DELETE | 删除评审 |
| /api/v1/reviews/:id/items | GET | 评审项列表 |
| /api/v1/reviews/:id/items | POST | 创建评审项 |
| /api/v1/reviews/:id/items/:itemId | PUT | 更新评审项 |
| /api/v1/reviews/:id/materials | GET | 评审材料 |
| /api/v1/reviews/:id/materials | POST | 上传材料 |
| /api/v1/reviews/:id/materials/:materialId | DELETE | 删除材料 |
| /api/v1/reviews/:id/participants | GET | 参与者列表 |
| /api/v1/reviews/:id/participants | POST | 添加参与者 |
| /api/v1/reviews/:id/ai-review | POST | AI审核 |
| /api/v1/reviews/types | GET | 评审类型列表 |
| /api/v1/reviews/types | POST | 创建评审类型（管理员） |
| /api/v1/reviews/templates | GET | 评审模板列表 |
| /api/v1/reviews/templates | POST | 创建评审模板 |

### A.9 文件服务 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/files/upload | POST | 文件上传 |
| /api/v1/files/:id | GET | 文件下载 |
| /api/v1/files/:id | DELETE | 删除文件 |
| /api/v1/files/:id/preview | GET | 获取预览信息 |
| /api/v1/files/:id/signed-url | GET | 获取签名URL |
| /api/v1/preview/health | GET | 预览服务状态 |

### A.10 通知服务 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/notifications | GET | 通知列表 |
| /api/v1/notifications/:id | PUT | 标记已读 |
| /api/v1/notifications/read-all | PUT | 全部标记已读 |
| /api/v1/notifications/preferences | GET | 获取通知偏好 |
| /api/v1/notifications/preferences | PUT | 更新通知偏好 |

### A.11 Dashboard API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/dashboard/stats | GET | 统计数据 |
| /api/v1/dashboard/risks | GET | 风险汇总 |
| /api/v1/dashboard/tasks | GET | 我的任务汇总 |
| /api/v1/dashboard/activities | GET | 最近活动 |

### A.12 AI服务 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/ai/risk-assess | POST | AI风险评估 |
| /api/v1/ai/review-audit | POST | AI评审审核 |
| /api/v1/ai/logs | GET | AI调用日志 |

### A.13 模板管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/templates | GET | 模板列表 |
| /api/v1/templates | POST | 创建模板 |
| /api/v1/templates/:id | GET | 模板详情 |
| /api/v1/templates/:id | PUT | 更新模板 |
| /api/v1/templates/:id | DELETE | 删除模板 |
| /api/v1/templates/import | POST | 导入模板 |

### A.14 标签管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/tags | GET | 标签列表 |
| /api/v1/tags | POST | 创建标签 |
| /api/v1/tags/:id | PUT | 更新标签 |
| /api/v1/tags/:id | DELETE | 删除标签 |

### A.15 邮件服务 API（管理员）

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/admin/email/configs | GET | 邮件配置列表 |
| /api/v1/admin/email/configs | POST | 创建邮件配置 |
| /api/v1/admin/email/configs/:id | PUT | 更新邮件配置 |
| /api/v1/admin/email/configs/:id | DELETE | 删除邮件配置 |
| /api/v1/admin/email/templates | GET | 邮件模板列表 |
| /api/v1/admin/email/templates | POST | 创建邮件模板 |
| /api/v1/admin/email/logs | GET | 邮件发送日志 |

### A.16 系统管理 API（管理员）

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v1/admin/users | GET | 用户管理列表 |
| /api/v1/admin/users/:id/role | PUT | 修改用户角色 |
| /api/v1/admin/logs | GET | 操作日志列表 |
| /api/v1/admin/health | GET | 系统健康检查 |
| /api/v1/admin/configs | GET | 系统配置列表 |
| /api/v1/admin/configs/:key | PUT | 更新系统配置 |

---

## 📋 答复确认

| 模块 | 答复状态 | 需进一步讨论 |
|------|:--------:|:------------:|
| AI服务相关 | ✅ 已完成 | ☐ |
| 文件服务相关 | ✅ 已完成 | ☐ |
| 数据模型相关 | ✅ 已完成 | ☐ |
| 权限与角色相关 | ✅ 已完成 | ☐ |
| 通知机制相关 | ✅ 已完成 | ☐ |
| API设计相关 | ✅ 已完成 | ☐ |
| 环境配置相关 | ✅ 已完成 | ☐ |
| 实施计划相关 | ✅ 已完成 | ☐ |
| 其他问题 | ✅ 已完成 | ☐ |

---

**答复人：** 技术架构师
**答复日期：** 2024年
