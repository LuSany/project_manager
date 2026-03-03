# 测试完善计划 - 总览文档

**版本**: v1.0  
**日期**: 2026-03-03  
**策略**: 方案 A - 先修复，后覆盖  
**总时间**: 5-7 天

---

## 📋 目录

1. [执行摘要](#执行摘要)
2. [阶段划分](#阶段划分)
3. [快速启动](#快速启动)
4. [进度追踪](#进度追踪)
5. [成功标准](#成功标准)

---

## 执行摘要

### 当前状态

| 指标           | 数值   | 健康度      |
| -------------- | ------ | ----------- |
| 测试通过率     | 59.5%  | ⚠️ 需要改进 |
| 失败测试       | 203    | ❌ 严重问题 |
| 覆盖率（语句） | 13.22% | ❌ 严重不足 |
| 覆盖率（分支） | 60.05% | ⚠️ 需要改进 |

### 核心问题

1. **集成测试大规模失败** (203 个)
   - ProjectMember.role 枚举值错误
   - Schema 字段不匹配
   - Mock 配置不完整

2. **测试覆盖率严重不足**
   - 大量业务代码未测试
   - API 路由缺少测试
   - Stores 状态管理无测试

### 解决策略

**阶段 1** (2-3 天): 修复所有失败的集成测试  
**阶段 2** (3-4 天): 大幅提高单元测试覆盖率

---

## 阶段划分

### 阶段 1: 集成测试修复

**时间**: 2-3 天  
**目标**: 通过率 85%+，失败 <50

**主要任务**:

- [x] 创建 Git 工作区
- [ ] Task 1.1: ProjectMember.role 枚举值修复 (16 个文件)
- [ ] Task 1.2: ReviewTemplateItem 字段修复
- [ ] Task 1.3: EmailLog.content 字段修复
- [ ] Task 1.4: ReviewTypeConfig 唯一约束修复
- [ ] Task 1.5: 其他 Mock/Schema 问题修复

**详细计划**: [`docs/plans/2026-03-03-test-fix-phase-1-plan.md`](./2026-03-03-test-fix-phase-1-plan.md)

---

### 阶段 2: 覆盖率提升

**时间**: 3-4 天  
**目标**: 语句覆盖率 40%+，新增测试 100+

**主要任务**:

- [ ] Task 2.1: API 路由测试 (50 个测试)
- [ ] Task 2.2: Stores 状态管理测试 (20 个测试)
- [ ] Task 2.3: 业务逻辑测试 (20 个测试)
- [ ] Task 2.4: 工具函数测试 (10 个测试)

**详细计划**: [`docs/plans/2026-03-03-coverage-improvement-plan.md`](./2026-03-03-coverage-improvement-plan.md)

---

## 快速启动

### 准备工作

```bash
# 1. 确保在正确的目录
cd /home/sany/projects/project_manager

# 2. 确保数据库运行
docker start test-postgres

# 3. 安装依赖（如需要）
npm install

# 4. 生成 Prisma 客户端
npm run db:generate
```

### 启动阶段 1

```bash
# 1. 切换到工作分支
git checkout test-fix-phase-1

# 2. 运行一次完整测试，了解问题
npm run test:unit 2>&1 | tee /tmp/test-baseline.txt

# 3. 开始修复
# 按照 phase-1-plan.md 中的任务列表执行
```

### 启动阶段 2

```bash
# 1. 确保阶段 1 完成
npm run test:unit 2>&1 | tail -20

# 2. 切换到工作分支
git checkout -b test-fix-phase-2

# 3. 查看当前覆盖率
npm run test:unit:coverage

# 4. 开始编写新测试
# 按照 coverage-improvement-plan.md 中的任务列表执行
```

---

## 进度追踪

### 每日检查清单

#### Day 1 (阶段 1 - P0 问题)

- [ ] ProjectMember.role 枚举值修复完成
- [ ] 运行测试验证修复
- [ ] 失败测试从 203 降至 ~150
- [ ] 提交第一次修复代码

#### Day 2 (阶段 1 - P1/P2 问题)

- [ ] ReviewTemplateItem 字段修复
- [ ] EmailLog.content 字段修复
- [ ] ReviewTypeConfig 唯一约束修复
- [ ] 失败测试降至 <50
- [ ] 提交第二次修复代码

#### Day 3 (阶段 1 - 验证)

- [ ] 运行完整测试套件
- [ ] 通过率 ≥85%
- [ ] 编写阶段 1 总结
- [ ] 准备阶段 2 分支

#### Day 4 (阶段 2 - API 测试)

- [ ] Auth API 测试完成
- [ ] Project API 测试完成
- [ ] Task API 测试完成
- [ ] 新增测试 ≥40 个
- [ ] 覆盖率提升至 ~23%

#### Day 5 (阶段 2 - Stores + 业务)

- [ ] 所有 Stores 测试完成
- [ ] 业务逻辑测试完成
- [ ] 新增测试 ≥80 个
- [ ] 覆盖率提升至 ~33%

#### Day 6 (阶段 2 - 完成)

- [ ] 所有计划测试完成
- [ ] 新增测试 ≥100 个
- [ ] 覆盖率 ≥40%
- [ ] 编写阶段 2 总结

#### Day 7 (缓冲 + 收尾)

- [ ] 处理遗留问题
- [ ] 优化测试执行速度
- [ ] 编写完整报告
- [ ] 准备合并到 main

---

## 成功标准

### 阶段 1 成功标准 ✅

- [ ] 所有 P0 问题修复（ProjectMember.role）
- [ ] 所有 P1 问题修复（Schema 不匹配）
- [ ] 集成测试失败数 <50
- [ ] 整体测试通过率 ≥85%
- [ ] 所有修复通过 CI/CD 验证

### 阶段 2 成功标准 ✅

- [ ] 语句覆盖率 ≥40%
- [ ] 分支覆盖率 ≥75%
- [ ] 函数覆盖率 ≥70%
- [ ] 新增测试用例 ≥100 个
- [ ] 所有新增测试通过验证

### 整体成功标准 ✅

- [ ] 阶段 1 和阶段 2 全部完成
- [ ] 测试通过率 ≥90%
- [ ] 覆盖率显著提升
- [ ] 代码质量提高
- [ ] 文档完整

---

## 工具使用指南

### 查找失败测试

```bash
# 运行测试并保存输出
npm run test:unit 2>&1 | tee /tmp/test-output.txt

# 查找所有 FAIL
grep "FAIL" /tmp/test-output.txt

# 统计失败数量
grep "FAIL" /tmp/test-output.txt | wc -l
```

### 批量替换

```bash
# 使用 ast-grep 查找
npx ast-grep --pattern 'role: "OWNER"' --lang ts

# 使用 ast-grep 替换
npx ast-grep --pattern 'role: "OWNER"' \
  --rewrite 'role: "PROJECT_OWNER"' \
  --lang ts \
  --dry-run  # 先预览

# 实际替换（移除 --dry-run）
npx ast-grep --pattern 'role: "OWNER"' \
  --rewrite 'role: "PROJECT_OWNER"' \
  --lang ts
```

### 覆盖率分析

```bash
# 生成覆盖率
npm run test:unit:coverage

# 查看文本摘要
cat coverage/coverage-summary.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('Total:', data.get('total', {}))
"

# 打开 HTML 报告
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

---

## 常见问题

### Q1: 修复后测试仍然失败怎么办？

**A**:

1. 确认 Prisma 客户端已重新生成：`npm run db:generate`
2. 检查数据库是否运行：`docker ps | grep postgres`
3. 查看详细错误信息，可能是其他依赖问题

### Q2: 覆盖率没有提升怎么办？

**A**:

1. 确认测试文件命名正确（\*.test.ts）
2. 确认测试被 vitest 发现：`npm run test:unit -- --list`
3. 检查 vitest.config.ts 的 coverage.include 配置

### Q3: 测试执行太慢怎么办？

**A**:

1. 使用 `--bail` 参数在第一次失败时停止
2. 只运行相关测试：`npm run test:unit -- path/to/test.ts`
3. 优化 beforeEach/afterEach 逻辑

---

## 联系和支援

**项目负责人**: AI Assistant  
**沟通方式**: 通过对话工具  
**文档位置**: `docs/plans/` 目录

---

## 附录

### A. 相关文件

- [`docs/plans/2026-03-03-test-fix-phase-1-plan.md`](./2026-03-03-test-fix-phase-1-plan.md) - 阶段 1 详细计划
- [`docs/plans/2026-03-03-coverage-improvement-plan.md`](./2026-03-03-coverage-improvement-plan.md) - 阶段 2 详细计划
- [`docs/plans/2026-03-03-test-plan-complete.md`](./2026-03-03-test-plan-complete.md) - 之前的测试方案
- [`TEST_FIX_FINAL_SUMMARY.md`](../TEST_FIX_FINAL_SUMMARY.md) - 之前的修复报告

### B. 命令速查表

```bash
# 运行测试
npm run test:unit              # 单元测试
npm run test:unit:coverage     # 带覆盖率
npm run test:e2e              # E2E 测试

# 数据库
npm run db:generate           # 生成 Prisma
npm run db:migrate            # 运行迁移
npm run db:studio             # 打开 Studio

# 代码质量
npm run lint                  # 代码检查
npm run format                # 格式化
npm run typecheck             # 类型检查

# Git
git worktree add ../path -b branch-name  # 创建工作区
git checkout branch-name                 # 切换分支
git commit -m "fix(test): ..."          # 提交
```

---

**文档版本**: v1.0  
**创建时间**: 2026-03-03  
**最后更新**: 2026-03-03  
**状态**: ✅ 已批准，待执行
