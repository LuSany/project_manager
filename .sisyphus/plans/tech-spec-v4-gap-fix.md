# 项目管理系统 - 功能完善任务计划

> **基于 TECH_SPEC_V4 对比分析报告**
> 
> 生成日期：2026-02-25
> 分析范围：代码库 vs 技术规范 V4.0

---

## TL;DR

> **核心目标**：完善当前系统与 TECH_SPEC_V4 规范的差距，重点修复角色系统、任务状态、邮件服务等 P0 级缺失功能

> **主要交付物**：
> - 完整的 5 角色权限系统（PROJECT_OWNER, PROJECT_ADMIN, PROJECT_MEMBER 等）
> - 完整的 8 任务状态流转（含 CANCELLED, DELAYED, BLOCKED）
> - 真实的邮件发送服务（SMTP/第三方集成）
> - ReviewTemplate 评审模板系统
> - 完整的任务依赖管理

> **预计工作量**：大型（约 40-50 小时）
> **任务数量**：15 个主任务，45+ 子任务
> **并行执行**：YES - 可分 3 个波浪并行

---

## 执行策略

### 波浪 1：核心角色与状态系统（任务 1-5）
- 完善数据库模型
- 更新 API 端点
- 更新前端 UI

### 波浪 2：邮件服务集成（任务 6-9）
- SMTP/第三方服务配置
- 邮件发送实现
- 模板渲染

### 波浪 3：评审模板与任务依赖（任务 10-15）
- ReviewTemplate 模型
- 任务依赖 API
- 规范对齐

---

## 必须包含的功能

### P0 优先级（必须实现）
- [x] 5 角色系统：ADMIN, PROJECT_ADMIN, PROJECT_OWNER, PROJECT_MEMBER, EMPLOYEE
- [x] 8 任务状态：TODO, IN_PROGRESS, REVIEW, TESTING, DONE, CANCELLED, DELAYED, BLOCKED
- [x] 真实邮件发送（SMTP 或第三方服务）
- [x] 任务依赖关系管理

#### P1 优先级（应该实现）
- [ ] ReviewTemplate 评审模板模型
- [ ] 任务优先级命名统一（CRITICAL vs URGENT）
- [ ] Zod 4.x 升级
- [ ] 任务优先级命名统一（CRITICAL vs URGENT）
- [ ] Zod 4.x 升级

---

## 禁止事项（Guardrails）

- ❌ 不要修改现有数据库模型的结构（只能添加缺失的枚举值和模型）
- ❌ 不要破坏现有 API 的向后兼容性
- ❌ 不要在邮件服务未完成配置时发送真实邮件
- ❌ 不要跳过 TDD 流程（测试先行）
- ❌ 不要一次性提交超过 3 个文件的更改

---

## 验证策略

### 数据库验证
```bash
npx prisma generate
npx prisma migrate dev --name complete_role_system
```

### API 验证
```bash
# 运行所有 API 测试
npm run test:unit -- api/

# 运行 E2E 测试
npm run test:e2e
```

### 类型检查
```bash
npm run typecheck
```

### 构建验证
```bash
npm run build
```

---

## TODOs

> 每个任务都包含：实现步骤 + 测试用例 + Agent QA 场景

### 任务 1：完善角色枚举系统 ✅

**文件**：
- 修改：`prisma/schema.prisma:60-63`（SystemRole 枚举）
- 修改：`src/types/user.ts`（类型定义）
- 测试：`src/__tests__/user-role.test.ts`

**实现步骤**：
1. 在 SystemRole 枚举中添加 PROJECT_ADMIN, PROJECT_OWNER, PROJECT_MEMBER
2. 移除 REGULAR 枚举（或标记为 deprecated）
3. 添加 EMPLOYEE 枚举（普通员工）
4. 更新 TypeScript 类型定义
5. 添加角色权限映射表

**测试用例**：
- 验证所有 5 种角色可以正确创建
- 验证角色权限映射正确
- 验证向后兼容性（现有 REGULAR 用户迁移）

**提交**：YES
- 消息：`feat(auth): 完善 5 角色权限系统`
- 文件：`prisma/schema.prisma, src/types/user.ts`

---

### 任务 2：完善任务状态枚举 ✅

**文件**：
- 修改：`prisma/schema.prisma:216-222`（TaskStatus 枚举）
- 修改：`src/lib/api/task-types.ts`
- 测试：`src/__tests__/task-status.test.ts`

**实现步骤**：
1. 添加 CANCELLED, DELAYED, BLOCKED 状态到 TaskStatus 枚举
2. 更新状态流转验证逻辑
3. 添加状态变更 API 端点
4. 编写状态流转测试

**测试用例**：
- 验证所有 8 种状态可以正确设置
- 验证状态流转规则（如 TODO → IN_PROGRESS → DONE）
- 验证非法流转被拒绝（如 TODO → DONE 直接跳转）

**提交**：YES
- 消息：`feat(tasks): 完善 8 任务状态系统`

---

### 任务 3：任务优先级命名统一 ✅

**文件**：
- 修改：`prisma/schema.prisma:224-228`（TaskPriority 枚举）
- 修改：`src/lib/api/task-types.ts`
- 修改：`src/components/tasks/task-priority.tsx`
- 测试：`src/__tests__/task-priority.test.ts`

**实现步骤**：
1. 将 URGENT 改为 CRITICAL（或添加 CRITICAL 并标记 URGENT deprecated）
2. 更新前端组件中的优先级显示
3. 添加数据迁移脚本
4. 编写兼容性测试

**测试用例**：
- 验证 CRITICAL 优先级可以正确创建
- 验证现有 URGENT 任务正确显示
- 验证前端颜色编码正确

**提交**：YES（与任务 2 合并）
- 消息：`feat(tasks): 统一优先级命名为 CRITICAL`

---

### 任务 4：添加任务依赖模型 ✅

**文件**：
- 添加：`prisma/schema.prisma:TaskDependency 模型`
- 添加：`src/app/api/v1/tasks/[id]/dependencies/route.ts`
- 添加：`src/lib/services/task-dependency-service.ts`
- 测试：`src/__tests__/task-dependency.test.ts`

**实现步骤**：
1. 定义 TaskDependency 模型（taskId, dependsOnId, dependencyType）
2. 创建依赖服务层（验证循环依赖）
3. 实现 CRUD API 端点
4. 编写依赖关系测试

**依赖类型支持**：
- FINISH_TO_START: 任务 A 完成后任务 B 才能开始
- START_TO_START: 任务 A 开始后任务 B 才能开始
- FINISH_TO_FINISH: 任务 A 完成后任务 B 才能完成
- START_TO_FINISH: 任务 A 开始后任务 B 才能完成

**测试用例**：
- 验证任务依赖关系可以正确创建
- 验证循环依赖被拒绝
- 验证依赖任务的自动状态更新

**提交**：YES
- 消息：`feat(tasks): 添加任务依赖管理系统`

---

### 任务 5：更新用户状态枚举 ✅

**文件**：
- 修改：`prisma/schema.prisma:53-58`（UserStatus 枚举）
- 测试：`src/__tests__/user-status.test.ts`

**实现步骤**：
1. 统一 UserStatus 为 PENDING, ACTIVE, DISABLED（与规范一致）
2. 添加数据迁移（SUSPENDED/INACTIVE → DISABLED）
3. 更新相关业务逻辑

**测试用例**：
- 验证用户状态流转正确
- 验证禁用用户无法登录

**提交**：YES（与任务 1 合并）

---

### 任务 6：邮件服务配置模型验证 ✅

**文件**：
- 验证：`prisma/schema.prisma:EmailConfig 模型`
- 验证：`src/app/api/v1/admin/email/configs/route.ts`
- 测试：`src/__tests__/email-config.test.ts`

**实现步骤**：
1. 验证 EmailConfig 模型是否完整
2. 测试邮件配置 CRUD API
3. 添加 SMTP 配置验证逻辑

**测试用例**：
- 验证可以创建 SMTP 配置
- 验证配置连通性测试

**提交**：YES
- 消息：`feat(email): 验证邮件配置模型`

---

### 任务 7：实现真实邮件发送服务 ✅

**文件**：
- 修改：`src/lib/email.ts`（完整重写）
- 添加：`src/lib/email-providers/smtp.ts`
- 测试：`src/__tests__/email-send.test.ts`

**依赖**：安装 nodemailer
```bash
npm install nodemailer @types/nodemailer
```

**实现步骤**：
1. 安装 nodemailer
2. 实现 SMTP 发送逻辑
3. 实现 SendGrid/AWS SES 适配器（可选）
4. 添加邮件发送队列（防止并发过高）
5. 更新邮件日志状态

**测试用例**：
- 验证 SMTP 邮件可以成功发送
- 验证发送失败时正确记录日志
- 验证模板变量替换正确

**提交**：YES
- 消息：`feat(email): 实现真实 SMTP 邮件发送`

---

### 任务 8：密码重置邮件集成 ✅

**文件**：
- 修改：`src/app/api/v1/auth/forgot-password/route.ts`
- 修改：`src/lib/auth.ts`
- 测试：`src/__tests__/password-reset.test.ts`

**实现步骤**：
1. 更新忘记密码 API，调用真实邮件发送
2. 验证邮件发送成功后再返回成功响应
3. 添加邮件发送失败的回退逻辑

**测试用例**：
- 验证密码重置邮件成功发送
- 验证邮件发送失败时用户收到友好提示

**提交**：YES
- 消息：`feat(auth): 集成真实密码重置邮件发送`

---

### 任务 9：邮件通知偏好集成 ✅
**文件**：
- 修改：`src/lib/notification.ts`
- 修改：`src/app/api/v1/notifications/route.ts`
- 测试：`src/__tests__/notification-email.test.ts`

**实现步骤**：
1. 读取用户通知偏好设置
2. 根据偏好选择发送渠道（站内/邮件/SMS）
3. 实现邮件通知触发逻辑

**提交**：YES
- 消息：`feat(notification): 集成邮件通知偏好`

---

### 任务 10：添加评审模板模型

**文件**：
- 添加：`prisma/schema.prisma:ReviewTemplate 模型`
- 添加：`prisma/schema.prisma:ReviewTemplateItem 模型`
- 添加：`src/app/api/v1/review-templates/route.ts`
- 测试：`src/__tests__/review-template.test.ts`

**实现步骤**：
1. 定义 ReviewTemplate 模型（typeId, name, templateData）
2. 定义 ReviewTemplateItem 模型（templateId, title, order）
3. 实现 CRUD API
4. 添加模板应用逻辑

**测试用例**：
- 验证评审模板可以创建和编辑
- 验证模板可以应用到评审
- 验证模板项目顺序正确

**提交**：YES
- 消息：`feat(reviews): 添加评审模板系统`

---

### 任务 11：AI 服务 SDK 集成（可选）

**文件**：
- 评估：`src/lib/ai.ts`
- 决策：继续使用通用 API 或集成 z-ai-web-dev-sdk

**实现步骤**：
1. 评估当前 AI 实现是否满足需求
2. 如需要，集成 z-ai-web-dev-sdk
3. 更新 AI 配置模型

**提交**：根据评估决定

---

### 任务 12：Zod 版本升级

**文件**：
- 修改：`package.json`（zod: ^4.x）
- 修改：所有使用 Zod 的文件

**实现步骤**：
1. 升级 Zod 到 4.x
2. 修复 breaking changes
3. 运行类型检查
4. 运行所有测试

**提交**：YES
- 消息：`chore(deps): 升级 Zod 到 4.x`

---

### 任务 13：前端角色选择器组件

**文件**：
- 添加：`src/components/users/role-select.tsx`
- 修改：`src/app/projects/[id]/members/page.tsx`

**实现步骤**：
1. 创建角色选择器组件（支持 5 种角色）
2. 添加角色描述和权限预览
3. 更新成员管理页面

**提交**：YES
- 消息：`feat(ui): 添加 5 角色选择器组件`

---

### 任务 14：前端任务状态显示更新

**文件**：
- 修改：`src/components/tasks/task-status-badge.tsx`
- 修改：`src/components/tasks/task-list.tsx`
- 测试：`src/__tests__/e2e/task-status.test.ts`

**实现步骤**：
1. 更新状态徽章组件（支持 8 种状态）
2. 添加状态颜色和图标
3. 添加状态流转下拉菜单

**提交**：YES
- 消息：`feat(ui): 更新任务状态徽章支持 8 状态`

---

### 任务 15：端到端测试与文档更新 ✅

**文件**：
- 添加：`tests/e2e/role-system.spec.ts`
- 添加：`tests/e2e/task-dependencies.spec.ts`
- 添加：`tests/e2e/email-sending.spec.ts`
- 修改：`docs/TECHNICAL_SPECIFICATION_V4.md`（标记已实现）

**实现步骤**：
1. 编写角色系统 E2E 测试
2. 编写任务依赖 E2E 测试
3. 编写邮件发送 E2E 测试
4. 更新技术规范文档

**提交**：YES
- 消息：`test(e2e): 添加新功能端到端测试`

---

## 提交策略

| 任务后 | 提交消息 | 文件 |
|--------|---------|------|
| 1 | `feat(auth): 完善 5 角色权限系统` | schema.prisma, user-types.ts |
| 2,3 | `feat(tasks): 完善任务状态和优先级系统` | schema.prisma, task-types.ts |
| 4 | `feat(tasks): 添加任务依赖管理` | schema.prisma, task-dependency-service.ts |
| 7 | `feat(email): 实现 SMTP 邮件发送` | email.ts, smtp.ts |
| 8 | `feat(auth): 集成密码重置邮件` | forgot-password/route.ts |
| 10 | `feat(reviews): 添加评审模板系统` | schema.prisma, review-templates/route.ts |
| 12 | `chore(deps): 升级 Zod 4.x` | package.json, *.ts |
| 13 | `feat(ui): 角色选择器组件` | role-select.tsx |
| 14 | `feat(ui): 任务状态徽章更新` | task-status-badge.tsx |
| 15 | `test(e2e): 新功能端到端测试` | *.spec.ts |

---

## 成功标准

### 验证命令
```bash
# 数据库迁移
npx prisma migrate dev

# 类型检查
npm run typecheck

# 单元测试
npm run test:unit

# E2E 测试
npm run test:e2e

# 构建
npm run build
```

### 最终检查清单
- [x] 5 角色系统正常工作
- [x] 8 任务状态流转正确
- [x] 邮件可以真实发送
- [x] 任务依赖关系可创建
- [ ] 评审模板可应用
- [x] 所有测试通过
- [x] 类型检查通过
- [x] 构建成功

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 数据库迁移失败 | 高 | 先在开发环境测试，备份数据 |
| 邮件发送配置复杂 | 中 | 使用 mailhog 测试，提供配置向导 |
| 循环依赖检测复杂 | 中 | 使用成熟算法（DFS 检测） |
| Zod 升级破坏变更 | 中 | 查阅迁移指南，逐文件修复 |

---

*计划生成日期：2026-02-25*
*基于 TECH_SPEC_V4 对比分析*
