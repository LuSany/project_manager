# 测试修复计划 - 阶段 1：集成测试修复

**版本**: v1.0  
**日期**: 2026-03-03  
**执行策略**: 方案 A - 先修复，后覆盖  
**工作分支**: `test-fix-phase-1`

---

## 📊 当前状态

### 测试结果（2026-03-03 16:54）

| 指标         | 数值  | 目标      | 差距   |
| ------------ | ----- | --------- | ------ |
| **测试总数** | 751   | -         | -      |
| **通过测试** | 447   | 675 (90%) | -228   |
| **失败测试** | 203   | 0         | -203   |
| **跳过测试** | 101   | <50       | -51    |
| **通过率**   | 59.5% | 90%       | -30.5% |

### 失败原因分类

| 原因                                      | 影响文件数 | 影响测试数 | 优先级 |
| ----------------------------------------- | ---------- | ---------- | ------ |
| ProjectMember.role 枚举值无效             | 16         | ~80        | P0     |
| ReviewTemplateItem.description 字段不存在 | 1          | 1          | P1     |
| EmailLog.content 必需字段缺失             | 1          | 3          | P1     |
| ReviewTypeConfig 唯一约束冲突             | 1          | 2          | P2     |
| 其他 Mock/Schema 问题                     | ~5         | ~117       | P2     |

---

## 🎯 阶段 1 目标

**时间**: 2-3 天  
**目标**: 将集成测试通过率从 59.5% 提升至 85%+

### 成功标准

- [ ] 所有 P0 级别问题修复完成
- [ ] 集成测试失败数降至 50 个以下
- [ ] 整体测试通过率提升至 85%+
- [ ] 所有修复通过 CI/CD 验证

---

## 📋 任务分解

### Task 1.1: 修复 ProjectMember.role 枚举值（P0 - 最高优先级）

**影响范围**: 16 个测试文件，约 80 个测试用例

**问题描述**:
测试代码中使用 `role: "OWNER"`，但 Prisma Schema 定义为 `ProjectMemberRole` 枚举，有效值为：

- `PROJECT_OWNER`
- `PROJECT_ADMIN`
- `PROJECT_MEMBER`

**修复步骤**:

1. 确认 Schema 定义

   ```bash
   cat prisma/schema.prisma | grep -A 10 "enum ProjectMemberRole"
   ```

2. 批量替换（使用 ast-grep）

   ```bash
   # 搜索所有使用 "OWNER" 的地方
   npx ast-grep --pattern 'role: "OWNER"' --lang ts

   # 批量替换为 "PROJECT_OWNER"
   npx ast-grep --pattern 'role: "OWNER"' --rewrite 'role: "PROJECT_OWNER"' --lang ts
   ```

3. 验证修复
   ```bash
   npm run test:unit -- tests/integration/database/task-supplement.integration.test.ts
   ```

**涉及文件**:

- `tests/helpers/test-data-factory.ts` (createTestProjectMember 函数)
- `tests/integration/database/task-supplement.integration.test.ts`
- `tests/integration/database/issue.integration.test.ts`
- `tests/integration/database/risk-supplement.integration.test.ts`
- `tests/integration/database/project-supplement.integration.test.ts`
- `tests/integration/database/milestone.integration.test.ts`
- `tests/integration/database/requirement.integration.test.ts`
- `tests/integration/database/review.integration.test.ts`
- `tests/integration/database/report.integration.test.ts`
- 其他相关集成测试文件

**预计时间**: 2-3 小时

---

### Task 1.2: 修复 ReviewTemplateItem Schema 不匹配（P1）

**影响范围**: 1 个测试文件，1 个测试用例

**问题描述**:
测试代码尝试创建 `description` 字段，但该字段在 Schema 中不存在。

**错误信息**:

```
Unknown argument `description`. Available options are marked with ?.
```

**修复步骤**:

1. 查看当前 Schema

   ```bash
   cat prisma/schema.prisma | grep -A 15 "model ReviewTemplateItem"
   ```

2. 更新测试代码

   ```typescript
   // 移除 description 字段
   await testPrisma.reviewTemplateItem.create({
     data: {
       templateId: template.id,
       title: '代码规范检查',
       // description: "检查代码是否符合规范",  // ❌ 删除
       isRequired: true,
       order: 1,
     },
   })
   ```

3. 验证修复
   ```bash
   npm run test:unit -- tests/integration/database/template-supplement.integration.test.ts
   ```

**涉及文件**:

- `tests/integration/database/template-supplement.integration.test.ts`

**预计时间**: 30 分钟

---

### Task 1.3: 修复 EmailLog.content 必需字段（P1）

**影响范围**: 1 个测试文件，3 个测试用例

**问题描述**:
EmailLog 模型的 `content` 字段是必需的，但测试代码未提供。

**错误信息**:

```
Argument `content` is missing.
```

**修复步骤**:

1. 查看 Schema

   ```bash
   cat prisma/schema.prisma | grep -A 15 "model EmailLog"
   ```

2. 更新测试代码

   ```typescript
   await testPrisma.emailLog.create({
     data: {
       to: 'recipient@example.com',
       subject: '测试邮件',
       status: 'SENT',
       content: '测试邮件内容', // ✅ 添加
       sentAt: new Date(),
     },
   })
   ```

3. 验证修复
   ```bash
   npm run test:unit -- tests/integration/database/email-supplement.integration.test.ts
   ```

**涉及文件**:

- `tests/integration/database/email-supplement.integration.test.ts`

**预计时间**: 30 分钟

---

### Task 1.4: 修复 ReviewTypeConfig 唯一约束（P2）

**影响范围**: 1 个测试文件，2 个测试用例

**问题描述**:
测试使用 `createTestReviewTypeConfig({ name: 'DESIGN' })`，但该名称已存在，触发唯一约束。

**错误信息**:

```
Unique constraint failed on the fields: (`name`)
```

**修复步骤**:

1. 更新测试数据工厂

   ```typescript
   export async function createTestReviewTypeConfig(
     overrides: Partial<Prisma.ReviewTypeConfigCreateInput> = {}
   ) {
     return testPrisma.reviewTypeConfig.create({
       data: {
         name: `TEST_${Date.now()}_${overrides.name || 'DEFAULT'}`, // ✅ 使用时间戳
         // ... 其他字段
         ...overrides,
       },
     })
   }
   ```

2. 或者在测试前清理数据

   ```typescript
   beforeEach(async () => {
     await testPrisma.reviewTypeConfig.deleteMany({
       where: { name: { startsWith: 'TEST_' } },
     })
   })
   ```

3. 验证修复
   ```bash
   npm run test:unit -- tests/integration/database/template-supplement.integration.test.ts
   ```

**涉及文件**:

- `tests/helpers/test-data-factory.ts`
- `tests/integration/database/template-supplement.integration.test.ts`

**预计时间**: 1 小时

---

### Task 1.5: 修复其他 Mock/Schema 问题（P2）

**影响范围**: 约 5 个文件，117 个测试用例

**问题类型**:

- Mock 配置不完整
- 数据库清理顺序错误
- 测试数据依赖问题

**修复策略**:

1. 逐个分析失败测试

   ```bash
   npm run test:unit -- tests/integration/database/*.test.ts 2>&1 | grep "FAIL"
   ```

2. 分类修复
   - Mock 问题 → 更新 Mock 配置
   - 清理顺序 → 优化 beforeEach/afterEach
   - 数据依赖 → 使用独立测试数据

3. 批量验证
   ```bash
   npm run test:unit -- tests/integration/database/ 2>&1 | tail -50
   ```

**预计时间**: 4-6 小时

---

## 📅 执行计划

### Day 1: P0 问题修复

**上午 (2-3 小时)**:

- [ ] Task 1.1: ProjectMember.role 枚举值修复
- [ ] 验证修复效果

**下午 (2-3 小时)**:

- [ ] Task 1.2: ReviewTemplateItem 字段修复
- [ ] Task 1.3: EmailLog.content 字段修复
- [ ] 运行完整集成测试验证

**预期结果**: 失败测试从 203 降至 ~120

---

### Day 2: P1/P2 问题修复

**上午 (3-4 小时)**:

- [ ] Task 1.4: ReviewTypeConfig 唯一约束修复
- [ ] Task 1.5: 其他 Mock/Schema 问题（上半场）

**下午 (3-4 小时)**:

- [ ] Task 1.5: 其他 Mock/Schema 问题（下半场）
- [ ] 运行完整测试套件验证

**预期结果**: 失败测试从 ~120 降至 <50

---

### Day 3: 验证和收尾

**上午 (2-3 小时)**:

- [ ] 运行完整测试套件
- [ ] 分析剩余失败测试
- [ ] 记录无法立即修复的问题

**下午 (2-3 小时)**:

- [ ] 编写修复报告
- [ ] 准备阶段 2 计划
- [ ] 代码审查和提交

**预期结果**:

- 整体测试通过率 85%+
- 生成完整的修复报告
- 阶段 2 计划就绪

---

## 🔍 验证方法

### 1. 单元测试验证

```bash
# 运行单个测试文件
npm run test:unit -- tests/integration/database/task-supplement.integration.test.ts

# 运行所有集成测试
npm run test:unit -- tests/integration/

# 运行完整测试套件
npm run test:unit
```

### 2. 覆盖率验证

```bash
# 生成覆盖率报告
npm run test:unit:coverage

# 查看覆盖率摘要
cat coverage/coverage-summary.json
```

### 3. 类型检查

```bash
# 确保没有类型错误
npm run typecheck
```

### 4. 代码格式化

```bash
# 格式化代码
npm run format
```

---

## ⚠️ 风险点

### 风险 1: Schema 与代码不同步

**症状**: 修复后发现更多字段不匹配
**应对**:

1. 运行 `prisma generate` 确保客户端最新
2. 对比 Schema 和测试代码
3. 必要时更新测试数据工厂

### 风险 2: 数据库状态污染

**症状**: 测试间数据干扰导致失败
**应对**:

1. 确保每个测试使用独立事务
2. 优化 beforeEach/afterEach 清理逻辑
3. 使用 `test-db.ts` 工具进行隔离

### 风险 3: 修复引入新问题

**症状**: 修复后其他测试开始失败
**应对**:

1. 每次只修复一个问题
2. 修复后立即运行相关测试
3. 使用 git 工作区隔离修改

---

## 📊 进度追踪

### 指标看板

| 指标       | 基线    | Day1 | Day2 | Day3 | 目标 |
| ---------- | ------- | ---- | ---- | ---- | ---- |
| 失败测试数 | 203     | ~120 | <50  | <30  | 0    |
| 通过率     | 59.5%   | 70%+ | 85%+ | 90%+ | 90%+ |
| P0 问题    | 16 文件 | 0    | 0    | 0    | 0    |
| P1 问题    | 4       | 2    | 0    | 0    | 0    |
| P2 问题    | ~5 文件 | ~5   | ~2   | 0    | 0    |

### 每日检查点

**Day 1 结束**:

- [ ] P0 问题全部修复
- [ ] 失败测试 <150
- [ ] 所有修复通过验证

**Day 2 结束**:

- [ ] P1 问题全部修复
- [ ] 失败测试 <50
- [ ] 通过率 85%+

**Day 3 结束**:

- [ ] P2 问题基本修复
- [ ] 失败测试 <30
- [ ] 修复报告完成

---

## 📝 输出物

1. **修复的代码**
   - 更新后的测试文件
   - 更新的测试数据工厂
   - 更新的 Mock 配置

2. **文档**
   - 本计划文档
   - 修复执行报告
   - 剩余问题清单

3. **Git 提交**
   ```
   fix(test): 修复 ProjectMember.role 枚举值问题
   fix(test): 修复 ReviewTemplateItem 字段不匹配
   fix(test): 修复 EmailLog.content 必需字段
   fix(test): 修复 ReviewTypeConfig 唯一约束
   fix(test): 修复其他集成测试问题
   ```

---

## 🚀 下一步

阶段 1 完成后，立即进入**阶段 2：提高单元测试覆盖率**

阶段 2 目标:

- 将语句覆盖率从 13.22% 提升至 40%+
- 将分支覆盖率从 60% 提升至 75%+
- 将函数覆盖率从 53% 提升至 70%+

详细计划见：`docs/plans/2026-03-03-coverage-improvement-plan.md`（待创建）

---

**计划版本**: v1.0  
**创建时间**: 2026-03-03  
**负责人**: AI Assistant  
**状态**: 待执行
