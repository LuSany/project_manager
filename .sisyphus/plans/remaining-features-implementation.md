# 未实现功能完整实施计划

## TL;DR

> **快速摘要**: 本计划涵盖 2 个 P1 功能 (AI 评审辅助 API、评审汇总报告) + 1 个技术债务 (Zod 升级) + 1 个代码组织优化 (认证路由统一)，包含完整的前后端实现。

> **交付物**:
> - AI 评审辅助 API (4 个子功能：材料分析、检查项生成、风险识别、摘要生成)
> - 评审汇总报告生成 (支持 PDF/Word/HTML 全格式)
> - 评审管理前端页面 (AI 分析界面 + 报告查看/导出)
> - Zod 4.x 升级
> - 认证路由统一为 `(auth)` 组

> **预计工作量**: 8-12 天
> **并行执行**: YES - 5 个 Wave
> **关键路径**: Zod 升级 → AI 评审 API → 评审报告 → 前端页面 → 路由优化

---

## Context

### 原始请求
用户要求为所有未实现的功能制定详细工作计划，包括：
1. AI 评审辅助 API (P1)
2. 评审汇总报告 (P1)
3. Zod 升级到 4.x
4. 认证路由统一为 `(auth)` 组

### 访谈总结
**关键决策**:
- **优先级**: 全部一起完成，统一交付
- **AI 评审范围**: 4 个功能全实现 (材料分析、检查项生成、风险识别、摘要生成)
- **报告格式**: 全格式支持 (PDF + Word + HTML)
- **前端**: 前后端完整实现
- **AI 提供商**: 通用 AIProvider (使用现有基础设施)

**研究结果**:
- 当前 AI 基础设施完整 (`AIConfig`, `AILog`, `AiResponseCache`)
- 评审基础功能完整 (`Review`, `ReviewTypeConfig`, `ReviewMaterial`, `ReviewParticipant`, `ReviewItem`, `ReviewCriterion`)
- Zod 当前版本 3.24.0，升级到 4.x 需要检查 breaking changes

---

## Work Objectives

### 核心目标
实现技术规格 V4.0 中定义的所有 P1 功能，消除技术债务，统一代码组织规范。

### 具体交付物
1. `POST /api/v1/reviews/[id]/ai-analyze` - AI 材料分析 API
2. `POST /api/v1/reviews/[id]/ai-generate-criteria` - AI 生成检查项 API
3. `POST /api/v1/reviews/[id]/ai-identify-risks` - AI 风险识别 API
4. `POST /api/v1/reviews/[id]/ai-generate-summary` - AI 生成摘要 API
5. `POST /api/v1/reports/review/[id]/generate` - 评审报告生成 API
6. `GET /api/v1/reports/review/[id]/download?format=pdf|docx|html` - 报告下载 API
7. 评审管理前端页面 (AI 分析界面 + 报告查看)
8. Zod 4.x 升级
9. 认证路由统一为 `(auth)` 组

### 完成定义
- [ ] 所有 API 端点测试通过
- [ ] 前端页面功能完整
- [ ] Zod 升级后类型检查通过
- [ ] 所有现有测试保持通过
- [ ] 代码审查通过

### Must Have
- AI 评审 API 响应时间 < 30 秒
- 报告生成支持 PDF/Word/HTML 三种格式
- Zod 升级后无类型错误
- 认证路由重构后功能不变

### Must NOT Have (Guardrails)
- ❌ 不修改现有评审核心逻辑
- ❌ 不破坏现有 API 兼容性
- ❌ 不引入新的外部依赖 (除报告生成库)
- ❌ 不修改数据库 Schema(仅新增表)

---

## Verification Strategy

### 测试策略
- **基础设施**: 已存在 (Vitest + Playwright)
- **自动化测试**: TDD 模式 (先写测试，再实现)
- **Agent-Executed QA**: 每个任务包含详细 QA 场景

### 测试决策
- **基础设施存在**: YES
- **自动化测试**: YES (TDD)
- **框架**: Vitest (单元测试) + Playwright (E2E)

---

## Execution Strategy

### 并行执行 Waves

```
Wave 1 (启动即刻):
├── Task 1: Zod 4.x 升级
└── Task 2: AI 评审 API - 基础设施

Wave 2 (Wave 1 完成后):
├── Task 3: AI 材料分析 API
├── Task 4: AI 检查项生成 API
└── Task 5: AI 风险识别 API

Wave 3 (Wave 2 完成后):
├── Task 6: AI 摘要生成 API
└── Task 7: 评审报告生成后端

Wave 4 (Wave 3 完成后):
├── Task 8: 评审报告前端页面
└── Task 9: AI 评审前端界面

Wave 5 (Wave 4 完成后):
└── Task 10: 认证路由统一为 (auth) 组

关键路径: Task 1 → Task 2 → Task 3/4/5 → Task 6/7 → Task 8/9 → Task 10
并行加速: 约 45% 快于顺序执行
```

### 依赖矩阵

| 任务 | 依赖 | 阻塞 | 可并行 |
|------|------|------|--------|
| 1 | 无 | 2, 3, 4, 5 | 2 |
| 2 | 1 | 3, 4, 5, 6 | 1 |
| 3 | 2 | 6 | 4, 5 |
| 4 | 2 | 6 | 3, 5 |
| 5 | 2 | 6 | 3, 4 |
| 6 | 3, 4, 5 | 7, 8 | 7 |
| 7 | 6 | 8, 9 | 6 |
| 8 | 6, 7 | 10 | 9 |
| 9 | 6, 7 | 10 | 8 |
| 10 | 8, 9 | 无 | 无 |

### Agent 调度摘要

| Wave | 任务 | 推荐 Agent |
|------|------|-----------|
| 1 | 1, 2 | `category="quick"` (Zod 升级), `category="unspecified-high"` (AI 基建) |
| 2 | 3, 4, 5 | `category="unspecified-high"` × 3 并行 |
| 3 | 6, 7 | `category="unspecified-high"` (AI 摘要), `category="artistry"` (报告生成) |
| 4 | 8, 9 | `category="visual-engineering"` × 2 并行 |
| 5 | 10 | `category="quick"` (路由重构) |

---

## TODOs

> 实施 + 测试 = 同一任务。每个任务包含：推荐 Agent 配置 + 并行化信息。

- [ ] 1. **Zod 4.x 升级**

  **做什么**:
  - 检查 Zod 4.x breaking changes
  - 更新 `package.json`: `zod@^4.0.0`
  - 运行 `npm install`
  - 修复类型错误
  - 运行类型检查 `npm run typecheck`
  - 运行测试 `npm run test:unit`

  **禁止**:
  - 不修改业务逻辑
  - 不引入新的 Zod 依赖

  **推荐 Agent 配置**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
  - **理由**: 依赖升级是标准化操作，git-master 确保提交规范

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 1 (与 Task 2)
  - **阻塞**: Task 2, 3, 4, 5, 6
  - **被阻塞**: 无

  **参考**:
  - `package.json:49` - 当前 Zod 版本定义
  - Zod 官方迁移指南：https://zod.dev/?id=migration-guide
  - `src/types/*.ts` - 使用 Zod 的类型定义文件

  **验收标准**:
  - [ ] `npm run typecheck` 通过 (0 错误)
  - [ ] `npm run test:unit` 通过 (100% 现有测试)
  - [ ] `npm run build` 成功

  **Agent-Executed QA 场景**:

  ```
  Scenario: Zod 升级后类型检查通过
    Tool: Bash
    Preconditions: Zod 已升级到 4.x
    Steps:
      1. 运行：npm run typecheck
      2. 检查：exit code 为 0
      3. 检查：输出中无 error
    Expected Result: 类型检查通过
    Evidence: 终端输出捕获

  Scenario: 单元测试全部通过
    Tool: Bash
    Preconditions: 升级完成
    Steps:
      1. 运行：npm run test:unit
      2. 检查：exit code 为 0
      3. 检查：所有测试通过
    Expected Result: 测试通过
    Evidence: 测试输出
  ```

  **提交**: YES
  - Message: `chore(deps): 升级 Zod 到 4.x`
  - Files: `package.json`, `package-lock.json`, `src/types/*.ts`
  - Pre-commit: `npm run typecheck && npm run test:unit`

---

- [ ] 2. **AI 评审 API - 基础设施**

  **做什么**:
  - 创建 AI 评审服务类 `src/lib/services/ai-review.ts`
  - 实现 AI 提示词模板 (材料分析、检查项生成、风险识别、摘要生成)
  - 添加 AI 评审结果缓存
  - 创建 AI 评审类型定义 `src/types/ai-review.ts`
  - 实现评审材料预处理函数

  **禁止**:
  - 不修改现有 `AIConfig`, `AILog` 模型
  - 不使用外部 AI SDK(使用现有 jose+fetch)

  **推荐 Agent 配置**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]
  - **理由**: AI 服务需要仔细设计提示词和错误处理，TDD 确保质量

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 1 (与 Task 1)
  - **阻塞**: Task 3, 4, 5, 6
  - **被阻塞**: Task 1 (Zod 升级)

  **参考**:
  - `src/lib/ai.ts` - 现有 AI 服务实现
  - `src/lib/cache.ts` - 缓存模式
  - `prisma/schema.prisma:895-947` - AILog, AIConfig 模型
  - `src/types/api.ts` - API 类型定义模式

  **验收标准**:
  - [ ] `src/lib/services/ai-review.ts` 创建
  - [ ] `src/types/ai-review.ts` 创建
  - [ ] 4 个 AI 提示词模板实现
  - [ ] 单元测试覆盖提示词生成逻辑
  - [ ] `npm run typecheck` 通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: AI 评审服务类导入成功
    Tool: Bash
    Preconditions: 服务类已创建
    Steps:
      1. 运行：npx tsx -e "import { aiReviewService } from './src/lib/services/ai-review'"
      2. 检查：exit code 为 0
      3. 检查：无导入错误
    Expected Result: 模块可导入
    Evidence: 终端输出

  Scenario: AI 提示词模板生成正确
    Tool: Bash
    Preconditions: 服务类实现完成
    Steps:
      1. 运行测试：npm run test:unit -- ai-review.test.ts
      2. 检查：提示词包含必要字段
      3. 检查：提示词长度合理
    Expected Result: 提示词生成正确
    Evidence: 测试输出
  ```

  **证据捕获**:
  - [ ] 测试输出：`.sisyphus/evidence/task-2-test-output.txt`
  - [ ] 类型检查：`.sisyphus/evidence/task-2-typecheck.txt`

  **提交**: YES
  - Message: `feat(review): 实现 AI 评审服务基础设施`
  - Files: `src/lib/services/ai-review.ts`, `src/types/ai-review.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 3. **AI 材料分析 API**

  **做什么**:
  - 实现 `POST /api/v1/reviews/[id]/ai-analyze`
  - 分析评审材料内容 (文件类型、大小、数量)
  - AI 生成材料完整性评估
  - AI 识别材料缺失项
  - 存储分析结果到数据库 (新增 `ReviewAiAnalysis` 表)

  **禁止**:
  - 不修改评审材料上传逻辑
  - 不阻塞主请求 (使用后台任务模式)

  **推荐 Agent 配置**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]
  - **理由**: API 实现需要完整的错误处理和类型安全

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 2 (与 Task 4, 5)
  - **阻塞**: Task 6
  - **被阻塞**: Task 2

  **参考**:
  - `src/app/api/v1/reviews/route.ts` - 评审 API 模式
  - `src/lib/services/ai-review.ts:材料分析提示词`
  - `src/types/api.ts` - API 响应类型
  - `src/lib/api/response.ts` - 统一响应格式

  **验收标准**:
  - [ ] API 端点创建
  - [ ] 请求验证 (Zod schema)
  - [ ] 错误处理完整
  - [ ] 分析结果持久化
  - [ ] 单元测试覆盖
  - [ ] E2E 测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: AI 材料分析 API 成功调用
    Tool: Bash (curl)
    Preconditions: 评审已创建且有材料，AI 服务可用
    Steps:
      1. POST /api/v1/reviews/{review-id}/ai-analyze
      2. 检查：status 202 (Accepted)
      3. 等待：后台任务完成 (轮询或 webhook)
      4. GET /api/v1/reviews/{review-id}/ai-analysis
      5. 检查：response.completenessScore 存在
      6. 检查：response.missingItems 是数组
    Expected Result: 分析结果正确返回
    Evidence: API 响应体

  Scenario: AI 材料分析 API 无材料时返回错误
    Tool: Bash (curl)
    Preconditions: 评审已创建但无材料
    Steps:
      1. POST /api/v1/reviews/{review-id}/ai-analyze
      2. 检查：status 400
      3. 检查：response.error 包含"无材料"
    Expected Result: 返回适当的错误
    Evidence: API 响应体
  ```

  **数据库迁移**:
  ```prisma
  model ReviewAiAnalysis {
    id           String   @id @default(cuid())
    reviewId     String   @unique
    analysisType String   // MATERIAL_ANALYSIS, CRITERIA_GENERATION, RISK_IDENTIFICATION, SUMMARY
    result       String   // JSON 格式存储分析结果
    aiConfigId   String?
    duration     Int?     // 毫秒
    createdAt    DateTime @default(now())
    
    review       Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
    
    @@index([reviewId, analysisType])
  }
  ```

  **提交**: YES (与数据库迁移一起)
  - Message: `feat(api): 实现 AI 材料分析 API`
  - Files: `src/app/api/v1/reviews/[id]/ai-analyze/route.ts`, `prisma/schema.prisma`
  - Pre-commit: `npm run typecheck && npm run db:generate`

---

- [ ] 4. **AI 检查项生成 API**

  **做什么**:
  - 实现 `POST /api/v1/reviews/[id]/ai-generate-criteria`
  - 根据评审类型和材料 AI 生成检查项
  - 支持人工审核和编辑
  - 存储生成的检查项到 `ReviewItem`

  **禁止**:
  - 不覆盖人工创建的 `ReviewItem`
  - 不自动应用生成的检查项 (需审核)

  **推荐 Agent 配置**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]
  - **理由**: 与 Task 3 类似，需要 TDD 确保质量

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 2 (与 Task 3, 5)
  - **阻塞**: Task 6
  - **被阻塞**: Task 2

  **参考**:
  - `src/app/api/v1/reviews/[id]/ai-analyze/route.ts` - 类似 API 结构
  - `src/lib/services/ai-review.ts:检查项生成提示词`
  - `prisma/schema.prisma:687-699` - ReviewItem 模型

  **验收标准**:
  - [ ] API 端点创建
  - [ ] 生成的检查项可预览
  - [ ] 支持人工编辑后保存
  - [ ] 单元测试覆盖
  - [ ] E2E 测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: AI 检查项生成成功
    Tool: Bash (curl)
    Preconditions: 评审已创建，材料分析已完成
    Steps:
      1. POST /api/v1/reviews/{review-id}/ai-generate-criteria
         Body: { "reviewType": "DESIGN_REVIEW", "materials": [...] }
      2. 检查：status 200
      3. 检查：response.criteria 是数组
      4. 检查：每个 criteria 有 title, description, weight
      5. POST /api/v1/reviews/{review-id}/ai-generate-criteria/apply
         Body: { "criteriaIds": [...] }
      6. 检查：status 201
    Expected Result: 检查项生成并应用成功
    Evidence: API 响应体
  ```

  **提交**: YES
  - Message: `feat(api): 实现 AI 检查项生成 API`
  - Files: `src/app/api/v1/reviews/[id]/ai-generate-criteria/route.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 5. **AI 风险识别 API**

  **做什么**:
  - 实现 `POST /api/v1/reviews/[id]/ai-identify-risks`
  - AI 分析评审材料识别潜在风险
  - 生成风险建议 (可关联到 `Risk` 模块)
  - 支持人工审核后创建正式风险记录

  **禁止**:
  - 不自动创建 `Risk` 记录 (需人工确认)
  - 不使用高风险 AI 模型

  **推荐 Agent 配置**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]
  - **理由**: 与 Task 3, 4 类似

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 2 (与 Task 3, 4)
  - **阻塞**: Task 6
  - **被阻塞**: Task 2

  **参考**:
  - `src/app/api/v1/reviews/[id]/ai-analyze/route.ts` - 类似 API 结构
  - `src/lib/services/ai-review.ts:风险识别提示词`
  - `prisma/schema.prisma:1091-1162` - Risk 模型

  **验收标准**:
  - [ ] API 端点创建
  - [ ] 风险建议可预览
  - [ ] 支持一键创建正式风险记录
  - [ ] 单元测试覆盖
  - [ ] E2E 测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: AI 风险识别成功
    Tool: Bash (curl)
    Preconditions: 评审已创建，材料分析已完成
    Steps:
      1. POST /api/v1/reviews/{review-id}/ai-identify-risks
      2. 检查：status 200
      3. 检查：response.risks 是数组
      4. 检查：每个 risk 有 title, category, probability, impact
      5. POST /api/v1/reviews/{review-id}/ai-identify-risks/create
         Body: { "riskIndex": 0, "projectId": "..." }
      6. 检查：status 201
      7. 检查：返回创建的 Risk ID
    Expected Result: 风险识别并创建成功
    Evidence: API 响应体
  ```

  **提交**: YES
  - Message: `feat(api): 实现 AI 风险识别 API`
  - Files: `src/app/api/v1/reviews/[id]/ai-identify-risks/route.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 6. **AI 摘要生成 API**

  **做什么**:
  - 实现 `POST /api/v1/reviews/[id]/ai-generate-summary`
  - 综合材料分析、检查项、风险识别结果生成摘要
  - 支持多种摘要长度 (简短/标准/详细)
  - 存储摘要到 `Review` 或新表

  **禁止**:
  - 不覆盖人工编写的评审结论
  - 不使用过长的摘要 (限制 2000 字以内)

  **推荐 Agent 配置**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]
  - **理由**: 需要综合前面所有 AI 分析结果

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 3 (与 Task 7)
  - **阻塞**: Task 8, 9
  - **被阻塞**: Task 3, 4, 5

  **参考**:
  - `src/app/api/v1/reviews/[id]/ai-analyze/route.ts` - 类似 API 结构
  - `src/lib/services/ai-review.ts:摘要生成提示词`
  - `prisma/schema.prisma:600-649` - Review 模型

  **验收标准**:
  - [ ] API 端点创建
  - [ ] 支持长度参数 (short/standard/detailed)
  - [ ] 摘要质量符合预期
  - [ ] 单元测试覆盖
  - [ ] E2E 测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: AI 摘要生成 - 标准长度
    Tool: Bash (curl)
    Preconditions: 评审已完成材料分析、检查项、风险识别
    Steps:
      1. POST /api/v1/reviews/{review-id}/ai-generate-summary
         Body: { "length": "standard" }
      2. 检查：status 200
      3. 检查：response.summary 存在
      4. 检查：summary.length 在 500-1000 字
      5. 检查：summary 包含关键点
    Expected Result: 摘要生成正确
    Evidence: API 响应体

  Scenario: AI 摘要生成 - 过短摘要错误
    Tool: Bash (curl)
    Preconditions: 评审数据不足
    Steps:
      1. POST /api/v1/reviews/{review-id}/ai-generate-summary
         Body: { "length": "detailed" }
      2. 检查：status 400
      3. 检查：error 包含"数据不足"
    Expected Result: 返回适当错误
    Evidence: API 响应体
  ```

  **提交**: YES
  - Message: `feat(api): 实现 AI 摘要生成 API`
  - Files: `src/app/api/v1/reviews/[id]/ai-generate-summary/route.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 7. **评审报告生成后端**

  **做什么**:
  - 实现 `POST /api/v1/reports/review/[id]/generate`
  - 实现 `GET /api/v1/reports/review/[id]/download?format=pdf|docx|html`
  - 支持 PDF 导出 (使用 puppeteer 或 pdfkit)
  - 支持 Word 导出 (使用 docx 库)
  - 支持 HTML 预览
  - 报告包含：评审信息、材料列表、检查项结果、风险识别、AI 摘要

  **禁止**:
  - 不使用付费服务
  - 不生成过大的文件 (限制 10MB 以内)

  **推荐 Agent 配置**:
  - **Category**: `artistry`
  - **Skills**: [`superpowers/test-driven-development`]
  - **理由**: 报告生成需要创意性的格式设计和布局

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 3 (与 Task 6)
  - **阻塞**: Task 8, 9
  - **被阻塞**: Task 6

  **参考**:
  - `src/app/api/v1/files/upload/route.ts` - 文件处理模式
  - `prisma/schema.prisma:725-760` - FileStorage, PreviewServiceConfig
  - 报告生成库：https://pdfkit.org/, https://docx.js.org/

  **验收标准**:
  - [ ] PDF 生成可用
  - [ ] Word 生成可用
  - [ ] HTML 预览可用
  - [ ] 报告内容完整
  - [ ] 文件大小合理 (<10MB)
  - [ ] 单元测试覆盖
  - [ ] E2E 测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: 评审报告 PDF 下载
    Tool: Bash (curl)
    Preconditions: 评审已完成，有 AI 分析结果
    Steps:
      1. GET /api/v1/reports/review/{review-id}/download?format=pdf
      2. 检查：status 200
      3. 检查：Content-Type 是 application/pdf
      4. 检查：文件大小 < 10MB
      5. 保存文件到：.sisyphus/evidence/task-7-report.pdf
    Expected Result: PDF 文件成功下载
    Evidence: .sisyphus/evidence/task-7-report.pdf

  Scenario: 评审报告 Word 下载
    Tool: Bash (curl)
    Preconditions: 评审已完成
    Steps:
      1. GET /api/v1/reports/review/{review-id}/download?format=docx
      2. 检查：status 200
      3. 检查：Content-Type 是 application/vnd.openxmlformats-officedocument.wordprocessingml.document
      4. 保存文件到：.sisyphus/evidence/task-7-report.docx
    Expected Result: Word 文件成功下载
    Evidence: .sisyphus/evidence/task-7-report.docx

  Scenario: 评审报告 HTML 预览
    Tool: Playwright
    Preconditions: 评审已完成
    Steps:
      1. 导航到：/reviews/{review-id}/report
      2. 等待：报告内容加载完成
      3. 检查：页面包含评审标题
      4. 检查：页面包含材料列表
      5. 检查：页面包含 AI 摘要
      6. 截图：.sisyphus/evidence/task-7-report-html.png
    Expected Result: HTML 预览正确显示
    Evidence: .sisyphus/evidence/task-7-report-html.png
  ```

  **依赖安装**:
  ```bash
  npm install pdfkit docx
  npm install -D @types/pdfkit
  ```

  **提交**: YES
  - Message: `feat(reports): 实现评审报告生成后端`
  - Files: `src/app/api/v1/reports/review/[id]/route.ts`, `src/lib/services/report-generator.ts`
  - Pre-commit: `npm run typecheck && npm run test:unit`

---

- [ ] 8. **评审报告前端页面**

  **做什么**:
  - 创建 `/reviews/[id]/report` 页面
  - 实现 HTML 报告预览
  - 实现导出按钮 (PDF/Word/HTML)
  - 实现报告加载状态
  - 实现错误处理

  **禁止**:
  - 不使用复杂的状态管理
  - 不阻塞主线程

  **推荐 Agent 配置**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`]
  - **理由**: 前端页面需要美观的 UI 设计和 E2E 验证

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 4 (与 Task 9)
  - **阻塞**: Task 10
  - **被阻塞**: Task 6, 7

  **参考**:
  - `src/app/(main)/projects/[id]/page.tsx` - 项目页面模式
  - `src/components/ui/` - shadcn/ui 组件
  - `src/app/api/v1/reports/review/[id]/route.ts` - 后端 API

  **验收标准**:
  - [ ] 页面路由正确
  - [ ] 报告预览正确
  - [ ] 导出按钮工作
  - [ ] 加载状态显示
  - [ ] 错误处理完善
  - [ ] E2E 测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: 评审报告页面加载
    Tool: Playwright
    Preconditions: 评审已创建，后端 API 可用
    Steps:
      1. 导航到：/reviews/{review-id}/report
      2. 等待：页面加载完成 (timeout: 10s)
      3. 检查：h1 包含评审标题
      4. 检查：报告内容区域存在
      5. 截图：.sisyphus/evidence/task-8-page-load.png
    Expected Result: 页面加载成功
    Evidence: .sisyphus/evidence/task-8-page-load.png

  Scenario: 评审报告 PDF 导出
    Tool: Playwright
    Preconditions: 报告页面已加载
    Steps:
      1. 点击：导出 PDF 按钮
      2. 等待：下载开始 (timeout: 5s)
      3. 检查：下载目录有 PDF 文件
      4. 检查：文件名包含 review-id
    Expected Result: PDF 下载成功
    Evidence: 下载的 PDF 文件

  Scenario: 评审报告错误处理
    Tool: Playwright
    Preconditions: 评审 ID 不存在
    Steps:
      1. 导航到：/reviews/invalid-id/report
      2. 等待：错误消息显示
      3. 检查：页面包含"评审不存在"
      4. 检查：有返回按钮
      5. 截图：.sisyphus/evidence/task-8-error-state.png
    Expected Result: 错误状态正确显示
    Evidence: .sisyphus/evidence/task-8-error-state.png
  ```

  **提交**: YES
  - Message: `feat(ui): 实现评审报告前端页面`
  - Files: `src/app/(main)/reviews/[id]/report/page.tsx`, `src/components/reviews/report-viewer.tsx`
  - Pre-commit: `npm run typecheck && npm run test:e2e -- report`

---

- [ ] 9. **AI 评审前端界面**

  **做什么**:
  - 创建 `/reviews/[id]/ai-analysis` 页面
  - 实现材料分析结果展示
  - 实现检查项生成预览和审核
  - 实现风险识别结果展示
  - 实现 AI 摘要展示
  - 实现一键应用/创建功能

  **禁止**:
  - 不使用复杂的状态管理
  - 不阻塞主线程 (AI 请求使用后台任务)

  **推荐 Agent 配置**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`]
  - **理由**: 需要美观的 AI 分析结果展示界面

  **并行化**:
  - **可并行**: YES
  - **并行组**: Wave 4 (与 Task 8)
  - **阻塞**: Task 10
  - **被阻塞**: Task 3, 4, 5, 6

  **参考**:
  - `src/app/(main)/projects/[id]/page.tsx` - 项目页面模式
  - `src/components/ui/` - shadcn/ui 组件
  - `src/app/api/v1/reviews/[id]/ai-*/route.ts` - AI API 端点

  **验收标准**:
  - [ ] AI 分析页面路由正确
  - [ ] 材料分析结果展示
  - [ ] 检查项预览和审核
  - [ ] 风险识别结果展示
  - [ ] AI 摘要展示
  - [ ] 一键应用功能工作
  - [ ] E2E 测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: AI 材料分析触发和查看
    Tool: Playwright
    Preconditions: 评审已创建且有材料
    Steps:
      1. 导航到：/reviews/{review-id}/ai-analysis
      2. 点击：开始分析按钮
      3. 等待：分析完成 (timeout: 30s)
      4. 检查：完整性分数显示
      5. 检查：缺失项列表显示
      6. 截图：.sisyphus/evidence/task-9-material-analysis.png
    Expected Result: 材料分析成功
    Evidence: .sisyphus/evidence/task-9-material-analysis.png

  Scenario: AI 检查项审核和应用
    Tool: Playwright
    Preconditions: AI 检查项已生成
    Steps:
      1. 导航到：/reviews/{review-id}/ai-analysis#criteria
      2. 检查：生成的检查项列表显示
      3. 编辑：某个检查项的标题
      4. 点击：应用按钮
      5. 等待：应用成功提示
      6. 导航到：/reviews/{review-id}
      7. 检查：检查项已添加到评审
      8. 截图：.sisyphus/evidence/task-9-criteria-applied.png
    Expected Result: 检查项应用成功
    Evidence: .sisyphus/evidence/task-9-criteria-applied.png

  Scenario: AI 风险创建
    Tool: Playwright
    Preconditions: AI 风险已识别
    Steps:
      1. 导航到：/reviews/{review-id}/ai-analysis#risks
      2. 点击：某个风险的创建按钮
      3. 等待：创建成功提示
      4. 导航到：/projects/{project-id}/risks
      5. 检查：新风险在列表中
      6. 截图：.sisyphus/evidence/task-9-risk-created.png
    Expected Result: 风险创建成功
    Evidence: .sisyphus/evidence/task-9-risk-created.png
  ```

  **提交**: YES
  - Message: `feat(ui): 实现 AI 评审前端界面`
  - Files: `src/app/(main)/reviews/[id]/ai-analysis/page.tsx`, `src/components/reviews/ai-analysis-viewer.tsx`
  - Pre-commit: `npm run typecheck && npm run test:e2e -- ai-analysis`

---

- [ ] 10. **认证路由统一为 (auth) 组**

  **做什么**:
  - 创建 `src/app/(auth)/` 目录
  - 移动 `/login` → `(auth)/login`
  - 移动 `/register` → `(auth)/register`
  - 移动 `/forgot-password` → `(auth)/forgot-password`
  - 移动 `/reset-password` → `(auth)/reset-password`
  - 创建 `(auth)/layout.tsx` (可选，用于统一认证页面样式)
  - 更新所有认证相关引用

  **禁止**:
  - 不修改认证逻辑
  - 不破坏现有功能
  - 不修改 API 路由

  **推荐 Agent 配置**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
  - **理由**: 路由重构是标准化操作，git-master 确保提交规范

  **并行化**:
  - **可并行**: NO
  - **并行组**: Wave 5 (顺序执行)
  - **阻塞**: 无
  - **被阻塞**: Task 8, 9

  **参考**:
  - `src/app/(main)/layout.tsx` - 主布局模式
  - `src/app/login/` - 当前登录页面
  - `src/app/register/` - 当前注册页面
  - Next.js 路由组文档：https://nextjs.org/docs/app/building-your-application/routing/colocation#route-groups

  **验收标准**:
  - [ ] 所有认证页面移动到 `(auth)` 组
  - [ ] `(auth)/layout.tsx` 创建
  - [ ] 所有路由正常工作
  - [ ] 所有链接更新正确
  - [ ] `npm run build` 成功
  - [ ] E2E 认证测试通过

  **Agent-Executed QA 场景**:

  ```
  Scenario: 登录页面访问
    Tool: Playwright
    Preconditions: 应用运行中
    Steps:
      1. 导航到：/login
      2. 等待：登录表单显示
      3. 检查：页面 URL 是 /login
      4. 检查：登录表单元素存在
      5. 截图：.sisyphus/evidence/task-10-login-page.png
    Expected Result: 登录页面正常访问
    Evidence: .sisyphus/evidence/task-10-login-page.png

  Scenario: 认证流程完整
    Tool: Playwright
    Preconditions: 应用运行中
    Steps:
      1. 导航到：/login
      2. 填充：邮箱和密码
      3. 点击：登录按钮
      4. 等待：导航到首页
      5. 检查：用户已登录状态
      6. 点击：退出登录
      7. 导航到：/register
      8. 检查：注册页面显示
    Expected Result: 认证流程正常
    Evidence: .sisyphus/evidence/task-10-auth-flow.png

  Scenario: 构建成功
    Tool: Bash
    Preconditions: 路由重构完成
    Steps:
      1. 运行：npm run build
      2. 检查：exit code 为 0
      3. 检查：输出中无 error
    Expected Result: 构建成功
    Evidence: 构建输出
  ```

  **提交**: YES
  - Message: `refactor(routes): 统一认证路由为 (auth) 组`
  - Files: `src/app/(auth)/**/*`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| 任务 | 提交消息 | 文件 | 验证 |
|------|---------|------|------|
| 1 | `chore(deps): 升级 Zod 到 4.x` | package.json, package-lock.json, src/types/*.ts | npm run typecheck && npm run test:unit |
| 2 | `feat(review): AI 评审服务基础设施` | src/lib/services/ai-review.ts, src/types/ai-review.ts | npm run typecheck |
| 3 | `feat(api): AI 材料分析 API` | src/app/api/v1/reviews/[id]/ai-analyze/route.ts, prisma/schema.prisma | npm run typecheck && npm run db:generate |
| 4 | `feat(api): AI 检查项生成 API` | src/app/api/v1/reviews/[id]/ai-generate-criteria/route.ts | npm run typecheck |
| 5 | `feat(api): AI 风险识别 API` | src/app/api/v1/reviews/[id]/ai-identify-risks/route.ts | npm run typecheck |
| 6 | `feat(api): AI 摘要生成 API` | src/app/api/v1/reviews/[id]/ai-generate-summary/route.ts | npm run typecheck |
| 7 | `feat(reports): 评审报告生成后端` | src/app/api/v1/reports/review/[id]/route.ts, src/lib/services/report-generator.ts | npm run typecheck && npm run test:unit |
| 8 | `feat(ui): 评审报告前端页面` | src/app/(main)/reviews/[id]/report/page.tsx | npm run typecheck && npm run test:e2e |
| 9 | `feat(ui): AI 评审前端界面` | src/app/(main)/reviews/[id]/ai-analysis/page.tsx | npm run typecheck && npm run test:e2e |
| 10 | `refactor(routes): 统一认证路由为 (auth) 组` | src/app/(auth)/**/* | npm run build |

---

## Success Criteria

### 验证命令
```bash
# 类型检查
npm run typecheck  # Expected: 0 errors

# 单元测试
npm run test:unit  # Expected: 所有测试通过

# E2E 测试
npm run test:e2e   # Expected: 所有测试通过

# 构建
npm run build      # Expected: 构建成功
```

### 最终检查清单
- [ ] 所有 API 端点测试通过
- [ ] 前端页面功能完整
- [ ] Zod 升级后类型检查通过
- [ ] 所有现有测试保持通过
- [ ] 认证路由重构后功能不变
- [ ] 报告生成支持 PDF/Word/HTML
- [ ] AI 评审 4 个功能全部可用

---

**计划创建时间**: 2026 年 2 月 25 日  
**计划版本**: 1.0  
**执行建议**: 运行 `/start-work` 开始执行
