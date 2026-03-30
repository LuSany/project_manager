# Phase 10: AI 增强功能 - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

为项目管理系统添加 AI 智能增强功能，包含两大模块：

1. **AI 风险识别** — 用户可手动触发 AI 分析项目数据识别风险，AI 提供评级建议和应对策略；系统支持定时自动扫描项目风险并通知用户。
2. **AI 评审员** — AI 作为特殊参与者自动参与评审流程，分析材料、识别问题、投票并生成决议草案。

**依赖**: Phase 3（任务视图，提供项目数据基础）, Phase 6（仪表盘，提供统计基础）

**Requirements:** AIRISK-01, AIRISK-02, AIRISK-03, AIRISK-04, AIREV-01, AIREV-02, AIREV-03, AIREV-04

**已有基础设施（大量可复用）：**

- `src/lib/ai.ts` — 完整 AI 服务层（callAI/analyzeRisk/auditReview）
- `src/lib/services/ai-review.ts` — 4 个 AI 评审函数（材料分析/标准生成/风险识别/摘要生成）
- Prisma 模型：`ai_configs`, `ai_logs`, `ai_response_cache`, `review_ai_analysis`
- Risk 模型 AI 字段：`isAiIdentified`, `aiRiskScore`, `aiSuggestion`
- 4 个评审 AI API 端点已存在
- `scheduled_jobs` 表、`notifyRiskAlert()` 函数、AI 配置管理页

</domain>

<decisions>
## Implementation Decisions

### AI 风险识别交互

- **D-01:** 在项目风险页面添加"AI 分析"按钮，用户手动触发 AI 风险分析
- **D-02:** AI 返回风险建议列表，用户逐条审核确认后转为正式风险记录（不自动创建）
- **D-03:** AI 分析覆盖：风险识别（AIRISK-01）、概率和影响评级建议（AIRISK-02）、应对策略建议（AIRISK-03）

### AI 评审员角色

- **D-04:** 新增 `AI_REVIEWER` 参与者角色到 `ParticipantRole` 枚举（区别于现有 REVIEWER/OBSERVER/SECRETARY/MODERATOR）
- **D-05:** 评审创建后 AI 自动触发——自动接收材料、分析并提交投票，标记为 AI 生成
- **D-06:** AI 投票不影响人类评审员共识机制，仅作为参考——评审完成条件仍为所有人类 REVIEWER 同意
- **D-07:** 用户可在 AI 配置中开关"AI 评审员"功能（项目级或全局级）

### 定时风险扫描 (AIRISK-04)

- **D-08:** 管理员可配置参与自动扫描的项目列表（在 AI 配置页设置）
- **D-09:** 每 8 小时自动扫描一次
- **D-10:** 发现风险后发送通知 + 建议列表，不自动创建风险记录，用户手动处理
- **D-11:** 扫描结果通过 `notifyRiskAlert()` 发送站内通知

### AI 分析结果展示

- **D-12:** 风险分析结果集成到现有风险页面，建议以卡片形式展示，可一键转为正式风险
- **D-13:** 评审决议草案在评审完成页展示，主持人查看并编辑确认（AIREV-04）
- **D-14:** 评审 AI 分析结果在评审详情页侧边栏展示（材料分析/风险识别/关键信息提取）（AIREV-02, AIREV-03）

### Claude's Discretion

- AI 分析的 loading 状态和骨架屏设计
- 建议列表的排序逻辑（按风险等级/类别）
- AI 分析报告的具体文案和格式
- 通知的具体内容和模板
- 侧边栏的具体布局和宽度
- AI_REVIEWER 在评审详情页的视觉区分样式
- 定时扫描的并发控制和错误重试策略

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目规划文档

- `.planning/PROJECT.md` — 项目愿景、约束、关键决策
- `.planning/REQUIREMENTS.md` — AIRISK-01~04, AIREV-01~04 完整需求定义
- `.planning/ROADMAP.md` — Phase 10 目标和成功标准
- `.planning/STATE.md` — 已确认决策和进度

### 核心 AI 基础设施（必须阅读）

- `src/lib/ai.ts` — 核心 AI 服务模块，`callAI()`/`analyzeRisk()`/`auditReview()` 函数，Provider 抽象，日志记录
- `src/lib/services/ai-review.ts` — AI 评审服务，4 个函数：analyzeMaterials/generateCriteria/identifyRisks/generateSummary
- `src/lib/cache.ts` — 内存缓存模块，AI 响应缓存用

### Prisma 数据模型

- `prisma/schema.prisma` §AI Models (lines 24-69) — `ai_configs`, `ai_logs`, `ai_response_cache`, `review_ai_analysis` 模型
- `prisma/schema.prisma` §AI Enums (lines 912-928) — `AIProvider`, `AIServiceType`, `AIStatus` 枚举（需扩展）
- `prisma/schema.prisma` §Risk Model (lines 597-626) — `risks` 模型含 `isAiIdentified`, `aiRiskScore`, `aiSuggestion` 字段
- `prisma/schema.prisma` §Risk Enums (lines 1088-1111) — `RiskCategory`, `RiskLevel`, `RiskStatus`
- `prisma/schema.prisma` §Review Models (lines 555-582) — `reviews`, `review_participants`, `review_votes`, `review_comments` 等
- `prisma/schema.prisma` §Review Enums — `ParticipantRole` (需添加 AI_REVIEWER), `ReviewStatus`

### 现有 AI API 端点（直接扩展）

- `src/app/api/v1/ai/analyze/risk/route.ts` — AI 风险分析端点（手动触发）
- `src/app/api/v1/ai/audit/review/route.ts` — AI 评审审计端点
- `src/app/api/v1/reviews/[id]/ai-analyze/route.ts` — 评审材料分析
- `src/app/api/v1/reviews/[id]/ai-identify-risks/route.ts` — 评审风险识别
- `src/app/api/v1/reviews/[id]/ai-generate-criteria/route.ts` — 评审标准生成
- `src/app/api/v1/reviews/[id]/ai-generate-summary/route.ts` — 评审摘要生成
- `src/app/api/v1/admin/ai/configs/route.ts` — AI 配置管理

### 风险管理参考

- `src/types/risk.ts` — Risk 类型定义，`calculateRiskLevel()` 函数，颜色映射
- `src/app/api/v1/risks/route.ts` — 风险 CRUD API
- `src/components/risks/` — 风险 UI 组件（RiskList/RiskCard/RiskMatrix/RiskForm 等）

### 评审系统参考

- `src/components/reviews/ReviewVoting.tsx` — 投票界面（需扩展支持 AI_REVIEWER 展示）
- `src/components/reviews/ReviewWizard.tsx` — 评审创建向导（需集成 AI 配置）
- `src/components/reviews/ReviewComments.tsx` — 评论系统
- `src/app/api/v1/reviews/[id]/votes/route.ts` — 投票 API（需支持 AI 投票）
- `src/app/api/v1/reviews/[id]/complete/route.ts` — 评审完成 API（需调整共识逻辑）

### 通知系统

- `src/lib/notification.ts` — `notifyRiskAlert()` 函数，通知偏好系统
- `prisma/schema.prisma` §NotificationType — 需扩展 `AI_RISK_SCAN_RESULT` 类型

### 定时任务

- `prisma/schema.prisma` §scheduled_jobs — `scheduled_jobs` 模型（cron/endpoint/method/payload）

### 管理后台参考

- `src/app/(main)/admin/ai/page.tsx` — AI 配置管理页（需扩展扫描配置）
- `src/app/(main)/admin/ai/components/AIConfigDialog.tsx` — AI 配置对话框
- `src/app/(main)/admin/ai/components/TestConnectionButton.tsx` — 测试连接按钮

### 前阶段上下文

- `.planning/phases/07-guan-li-hou-tai/07-CONTEXT.md` — Phase 7 管理后台模式（AI 配置页）
- `.planning/phases/09-shen-pei-e-yu-tong-ji/09-CONTEXT.md` — Phase 9 通知系统扩展模式

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/lib/ai.ts` — `callAI()` 函数可直接复用，`analyzeRisk()` 已实现风险分析逻辑，返回 AI 建议
- `src/lib/services/ai-review.ts` — 4 个函数已完整实现评审 AI 功能，Phase 10 主要做 UI 集成和流程编排
- `src/lib/notification.ts` — `notifyRiskAlert()` 可直接用于 AI 风险扫描通知
- `src/lib/cache.ts` — AI 响应缓存，避免重复调用
- `src/components/risks/RiskForm.tsx` — 风险创建表单，AI 建议转正式风险时可复用
- `src/components/risks/RiskCard.tsx` — 风险卡片展示，可扩展为 AI 建议卡片
- `src/components/reviews/ReviewVoting.tsx` — 投票界面，需扩展 AI_REVIEWER 投票展示
- `src/app/(main)/admin/ai/page.tsx` — AI 配置页，可扩展扫描配置

### Established Patterns

- AI 调用：`callAI()` + 日志记录到 `ai_logs` + 缓存到 `ai_response_cache`
- 通知创建：`createNotification()` + 专用通知函数 + `NotificationType` 枚举扩展
- 管理后台配置：TanStack Table + Dialog + Toast 模式（Phase 7）
- 评审参与者：`review_participants` 表 + `ParticipantRole` 枚举
- 投票流程：`review_votes` 表 + `agreed` 布尔值 + 共识检查
- API 统计：Promise.all 并行查询 + groupBy 聚合

### Integration Points

- **Prisma Schema 扩展**: `ParticipantRole` 新增 `AI_REVIEWER`；`AIServiceType` 新增 `RISK_SCAN`/`REVIEWER_VOTE`；`NotificationType` 新增 `AI_RISK_SCAN_RESULT`
- **风险页面扩展**: 在项目风险页添加"AI 分析"按钮 + 建议列表区域
- **评审流程扩展**: 评审创建时自动添加 AI_REVIEWER 参与者，评审开始时触发 AI 分析和投票
- **评审完成页扩展**: 展示 AI 生成的决议草案，主持人可编辑确认
- **评审详情页扩展**: 添加 AI 分析侧边栏
- **AI 配置页扩展**: 添加定时扫描项目配置、AI 评审员开关
- **定时任务**: 新建或复用 `scheduled_jobs` 记录，每 8 小时调用风险扫描 API

</code_context>

<specifics>
## Specific Ideas

- AI 建议卡片设计：风险标题 + 概率/影响评级 + 应对策略 + "创建为风险"按钮
- 评审侧边栏：上方材料摘要 → 中间风险识别 → 下方关键信息提取，可折叠
- AI 投票在 ReviewVoting 组件中以特殊样式展示（如带 AI 图标的投票卡片）
- 定时扫描配置在 AI 配置页新增 Tab，包含项目选择器和扫描频率设置
- 评审决议草案使用 Markdown 格式，包含结论、关键发现、建议行动
- AI_REVIEWER 在评审参与者列表中用特殊图标和颜色区分

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 10-ai_
_Context gathered: 2026-03-31_
