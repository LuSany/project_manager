# 测试覆盖率提升计划 - 阶段 2

**版本**: v1.0  
**日期**: 2026-03-03  
**前置条件**: 阶段 1 完成（集成测试修复）  
**工作分支**: `test-fix-phase-2`

---

## 📊 当前状态（阶段 1 完成后预期）

### 测试结果目标

| 指标         | 当前  | 阶段 1 后 | 阶段 2 目标 |
| ------------ | ----- | --------- | ----------- |
| **测试总数** | 751   | ~750      | ~800        |
| **通过测试** | 447   | ~650      | ~720        |
| **失败测试** | 203   | <50       | <30         |
| **跳过测试** | 101   | <50       | <50         |
| **通过率**   | 59.5% | 85%+      | 90%+        |

### 覆盖率现状（单元测试）

| 指标           | 当前   | 阶段 2 目标 | 差距    |
| -------------- | ------ | ----------- | ------- |
| **语句覆盖率** | 13.22% | 40%+        | +26.78% |
| **分支覆盖率** | 60.05% | 75%+        | +14.95% |
| **函数覆盖率** | 53.63% | 70%+        | +16.37% |
| **行覆盖率**   | 13.22% | 40%+        | +26.78% |

---

## 🎯 阶段 2 目标

**时间**: 3-4 天  
**目标**: 将单元测试覆盖率提升至 40%+（语句/行）

### 成功标准

- [ ] 语句覆盖率 ≥ 40%
- [ ] 分支覆盖率 ≥ 75%
- [ ] 函数覆盖率 ≥ 70%
- [ ] 新增测试用例 ≥ 100 个
- [ ] 所有新增测试通过验证

---

## 📋 覆盖率分析

### 已覆盖的模块（保持）

✅ **高覆盖率模块** (>60%):

- `src/lib/api/client.ts` - API 客户端
- `src/lib/api/response.ts` - 响应格式化
- `src/lib/cache.ts` - 缓存系统
- `src/lib/auth.ts` - 认证模块
- `src/lib/utils.ts` - 工具函数

### 待覆盖的模块（重点）

❌ **零覆盖率模块** (0%):

- 大部分 React 组件 (`src/components/`)
- 页面组件 (`src/app/(main)/**`)
- 状态管理 stores (`src/stores/`)
- API 路由实现 (`src/app/api/**/route.ts`)

⚠️ **低覆盖率模块** (<20%):

- 业务逻辑层
- 数据验证层
- 错误处理逻辑

---

## 📝 任务分解

### Task 2.1: API 路由测试（优先级：高）

**目标**: 为核心 API 路由添加测试

**覆盖范围**:

- `src/app/api/v1/auth/**/route.ts`
- `src/app/api/v1/projects/**/route.ts`
- `src/app/api/v1/tasks/**/route.ts`
- `src/app/api/v1/reviews/**/route.ts`

**测试要点**:

1. 成功场景 - 有效输入返回预期结果
2. 错误场景 - 无效输入返回适当错误
3. 权限验证 - 未授权用户被拒绝
4. 边界条件 - 空值、最大值、特殊字符

**示例结构**:

```typescript
describe('POST /api/v1/tasks', () => {
  it('应该创建成功当用户有权限', async () => {
    // Arrange
    const mockTask = { title: 'Test Task', projectId: '...' }

    // Act
    const response = await POST(mockRequest(mockTask))

    // Assert
    expect(response.status).toBe(201)
  })

  it('应该拒绝未授权用户', async () => {
    // Arrange
    const mockTask = { title: 'Test Task' }

    // Act
    const response = await POST(unauthorizedRequest(mockTask))

    // Assert
    expect(response.status).toBe(401)
  })
})
```

**预计时间**: 1.5 天  
**新增测试**: ~50 个

---

### Task 2.2: Stores 状态管理测试（优先级：中）

**目标**: 为 Zustand stores 添加测试

**覆盖范围**:

- `src/stores/projectStore.ts`
- `src/stores/taskStore.ts`
- `src/stores/userStore.ts`
- `src/stores/notificationStore.ts`

**测试要点**:

1. 初始状态正确
2. Actions 更新状态
3. 计算属性正确
4. 持久化功能

**示例结构**:

```typescript
describe('projectStore', () => {
  it('应该有正确的初始状态', () => {
    const { projects, selectedProject } = useProjectStore.getState()
    expect(projects).toEqual([])
    expect(selectedProject).toBeNull()
  })

  it('应该能添加项目', () => {
    const { addProject, projects } = useProjectStore.getState()
    addProject({ id: '1', name: 'Test' })
    expect(projects.length).toBe(1)
  })

  it('应该能选择项目', () => {
    const { selectProject, selectedProject } = useProjectStore.getState()
    selectProject('1')
    expect(selectedProject).toBe('1')
  })
})
```

**预计时间**: 0.5 天  
**新增测试**: ~20 个

---

### Task 2.3: 业务逻辑测试（优先级：高）

**目标**: 为核心业务逻辑添加边界条件测试

**覆盖范围**:

- `src/lib/business/` 下的逻辑
- 数据验证函数
- 状态转换逻辑
- 权限检查

**测试要点**:

1. 正常流程
2. 边界条件
3. 异常情况
4. 状态流转

**示例结构**:

```typescript
describe('Task Status Transitions', () => {
  it('应该允许 TODO -> IN_PROGRESS', () => {
    expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true)
  })

  it('不允许 TODO -> DONE (跳过中间状态)', () => {
    expect(canTransition('TODO', 'DONE')).toBe(false)
  })

  it('允许任何状态 -> CANCELLED', () => {
    expect(canTransition('IN_PROGRESS', 'CANCELLED')).toBe(true)
    expect(canTransition('REVIEW', 'CANCELLED')).toBe(true)
  })
})
```

**预计时间**: 0.5 天  
**新增测试**: ~20 个

---

### Task 2.4: 工具函数测试（优先级：低）

**目标**: 完善工具函数的边界条件测试

**覆盖范围**:

- `src/lib/utils.ts`
- `src/lib/validators/`
- `src/lib/formatters/`

**测试要点**:

1. 空值处理
2. 极端值处理
3. 类型转换
4. 格式化输出

**预计时间**: 0.5 天  
**新增测试**: ~10 个

---

## 📅 执行计划

### Day 1: API 路由测试（上半场）

**上午 (3 小时)**:

- [ ] Auth API 路由测试 (8-10 个测试)
- [ ] Project API 路由测试 (8-10 个测试)

**下午 (3 小时)**:

- [ ] Task API 路由测试 (10-12 个测试)
- [ ] Review API 路由测试 (8-10 个测试)

**预期结果**: 新增 ~40 个测试，覆盖率 +10%

---

### Day 2: API 路由测试（下半场）+ Stores 测试

**上午 (3 小时)**:

- [ ] 其他 API 路由测试 (10-15 个测试)
- [ ] API 错误处理测试 (5-8 个测试)

**下午 (3 小时)**:

- [ ] Project Store 测试 (5-7 个测试)
- [ ] Task Store 测试 (5-7 个测试)
- [ ] User Store 测试 (3-5 个测试)
- [ ] Notification Store 测试 (3-5 个测试)

**预期结果**: 新增 ~40 个测试，覆盖率 +10%

---

### Day 3: 业务逻辑测试 + 工具函数测试

**上午 (3 小时)**:

- [ ] 业务逻辑边界测试 (15-20 个测试)
- [ ] 状态流转测试 (10-12 个测试)

**下午 (3 小时)**:

- [ ] 工具函数测试 (8-10 个测试)
- [ ] 运行完整测试套件验证
- [ ] 分析覆盖率报告

**预期结果**: 新增 ~30 个测试，覆盖率 +10%

---

### Day 4: 优化和收尾

**上午 (2-3 小时)**:

- [ ] 优化测试执行速度
- [ ] 补充遗漏的边界条件
- [ ] 确保所有测试通过

**下午 (2-3 小时)**:

- [ ] 生成覆盖率报告
- [ ] 编写阶段 2 总结
- [ ] 准备阶段 3 计划（如需要）

**预期结果**: 覆盖率达到 40%+

---

## 🔍 验证方法

### 1. 覆盖率验证

```bash
# 运行带覆盖率的测试
npm run test:unit:coverage

# 查看覆盖率摘要
cat coverage/coverage-summary.json | python3 -m json.tool

# 查看 HTML 报告
open coverage/index.html
```

### 2. 测试质量验证

```bash
# 确保所有测试通过
npm run test:unit -- --run

# 检查测试执行时间
npm run test:unit -- --reporter=verbose
```

### 3. 类型检查

```bash
# 确保没有类型错误
npm run typecheck
```

---

## 📊 进度追踪

### 指标看板

| 指标       | 基线   | Day1 | Day2 | Day3 | Day4 | 目标 |
| ---------- | ------ | ---- | ---- | ---- | ---- | ---- |
| 语句覆盖率 | 13.22% | ~23% | ~33% | ~43% | ~45% | 40%+ |
| 分支覆盖率 | 60.05% | ~67% | ~72% | ~77% | ~78% | 75%+ |
| 函数覆盖率 | 53.63% | ~60% | ~65% | ~72% | ~73% | 70%+ |
| 新增测试   | 0      | ~40  | ~80  | ~110 | ~110 | 100+ |

### 每日检查点

**Day 1 结束**:

- [ ] 新增测试 ≥40 个
- [ ] 语句覆盖率 ≥23%
- [ ] 所有新增测试通过

**Day 2 结束**:

- [ ] 新增测试 ≥80 个
- [ ] 语句覆盖率 ≥33%
- [ ] Stores 测试完成

**Day 3 结束**:

- [ ] 新增测试 ≥110 个
- [ ] 语句覆盖率 ≥40%
- [ ] 业务逻辑测试完成

**Day 4 结束**:

- [ ] 覆盖率报告生成
- [ ] 阶段 2 总结完成
- [ ] 所有目标达成

---

## ⚠️ 风险点

### 风险 1: API 路由依赖复杂

**症状**: Mock 困难，测试编写缓慢
**应对**:

1. 使用已有的 Request Mock 工具
2. 优先测试核心逻辑
3. 复杂依赖暂时跳过

### 风险 2: 覆盖率提升遇到瓶颈

**症状**: 某些模块难以覆盖
**应对**:

1. 分析不可达代码
2. 考虑重构提高可测试性
3. 记录技术债务

### 风险 3: 测试执行时间过长

**症状**: 测试套件运行时间 >5 分钟
**应对**:

1. 优化 Mock 策略
2. 使用并行执行
3. 拆分大型测试文件

---

## 📝 输出物

1. **新增测试文件**
   - `src/app/api/v1/**/*.test.ts`
   - `src/stores/*.test.ts`
   - `tests/unit/business-logic.test.ts`

2. **覆盖率报告**
   - `coverage/index.html`
   - `coverage/coverage-summary.json`
   - `coverage/lcov.info`

3. **文档**
   - 本计划文档
   - 执行总结报告
   - 覆盖率分析报告

4. **Git 提交**
   ```
   test(api): 添加 Auth API 路由测试
   test(api): 添加 Project API 路由测试
   test(api): 添加 Task API 路由测试
   test(stores): 添加状态管理测试
   test(business): 添加业务逻辑测试
   docs: 添加阶段 2 执行报告
   ```

---

## 🎯 后续建议

### 阶段 3（可选）：覆盖率冲刺

如果阶段 2 完成后需要更高覆盖率：

**目标**: 60%+ 语句覆盖率
**时间**: 2-3 天
**重点**:

- 组件测试
- E2E 测试补充
- 边缘场景覆盖

### 长期维护

1. **CI/CD 集成**
   - 设置覆盖率门槛
   - PR 必须通过测试
   - 定期生成报告

2. **测试文化**
   - 新功能必须带测试
   - 代码审查包含测试
   - 定期测试重构

---

**计划版本**: v1.0  
**创建时间**: 2026-03-03  
**负责人**: AI Assistant  
**状态**: 待执行（依赖阶段 1 完成）
