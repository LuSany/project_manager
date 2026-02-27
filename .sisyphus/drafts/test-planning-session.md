# Draft: 测试质量提升规划会话

## 用户需求

用户选择：**选项B - 先调研更多细节再制定计划**

## 执行的调研任务

1. **bg_b784f326** - API路由测试失败分析
   - 状态: 未完成
   - 目标: 分析API路由测试失败模式

2. **bg_de53e703** - AI服务模块分析
   - 状态: 未完成
   - 目标: 分析AI服务覆盖率和测试需求

3. **bg_4f6508f4** - 认证模块覆盖率分析 ✅ **已完成**
   - 状态: 已完成
   - 关键发现: 测试文件测试本地mock函数，不是真实auth.ts

4. **bg_5478d797** - E2E测试模式分析
   - 状态: 未完成
   - 目标: 分析E2E测试结构和模式

5. **bg_377d59a9** - API响应模块分析
   - 状态: 未完成
   - 目标: 分析API响应层测试覆盖

## 已完成的分析结果

### 认证模块分析 (bg_4f6508f4)

**问题**:
- `src/__tests__/auth.test.ts` 测试的是本地mock函数（行 120-159）
- 不是导入真实 `src/lib/auth.ts` 中的函数
- `getAuthenticatedUser()` 和 `requireAuth()` 完全未测试

**未覆盖的代码**:
- 行 11-21: `getAuthenticatedUser` 全部逻辑
- 行 30-44: `requireAuth` 全部逻辑

**缺失测试场景**:
- 无 user-id cookie → 返回 null
- user-id 为空字符串 → 返回 null
- 用户不存在 → 返回 null
- 用户存在 → 返回用户对象
- 无认证 → 返回 401 错误
- 用户不存在 → 返回 404 错误

## 识别的主要问题

### 1. Vitest 兼容性问题
- `vi.mocked()` 不存在于 Vitest 3.x
- 位置: `tests/unit/api/client.test.ts:5`

### 2. API 路由测试响应格式问题
- `response.json()` 未定义（NextResponse vs 标准Response）
- 位置: `src/app/api/v1/auth/register/route.test.ts:42, 86, 107`

### 3. 测试数据不匹配
- 测试期望 `role: 'REGULAR'`，实际返回 `role: 'EMPLOYEE'`
- 位置: `src/app/api/v1/auth/register/route.test.ts:49-60`

### 4. 数据库初始化问题 ✅ 已修复
- 数据库路径已从 `"file:./test.db"` 改为 `"file:./prisma/test.db"`

### 5. 认证模块测试根本问题
- 测试文件测试本地mock，不是真实函数
- 需要完全重写认证测试

## 计划文件

- **位置**: `.sisyphus/plans/test-quality-improvement.md`
- **状态**: 已创建
- **内容**: 完整的6阶段测试提升计划

## 阶段总结

### 阶段一：修复测试失败 (P0)
- 修复 Vitest 兼容性
- 修复 API 路由测试响应格式
- 修复测试数据不匹配
- 验证数据库初始化
- 预估时间: 4小时

### 阶段二：提升AI服务覆盖率 (P1)
- 测试 callAI() 所有 serviceType
- 测试错误处理场景
- 测试 getDefaultAIConfig() 和 mapRiskScoreToLevel()
- 目标覆盖率: 1.83% → 70%
- 预估时间: 6小时

### 阶段三：提升认证模块覆盖率 (P1)
- 重写认证测试文件，导入真实函数
- 测试 getAuthenticatedUser() 和 requireAuth() 全部分支
- 覆盖安全关键路径
- 目标覆盖率: 47.83% → 85%
- 预估时间: 4小时

### 阶段四：提升API响应层覆盖率 (P1)
- 补充参数化测试
- 测试自定义消息和 details
- 目标覆盖率: 38.78% → 80%
- 预估时间: 3小时

### 阶段五：补充E2E测试 (P2)
- 需求管理 E2E 测试
- 文件预览 E2E 测试
- 评审流程 E2E 测试
- 通知系统 E2E 测试
- 目标覆盖率: 40% → 75%
- 预估时间: 8小时

### 阶段六：覆盖率整体优化 (P2)
- 邮件服务优化（75.76% → 85%）
- 边缘场景和错误处理
- 目标覆盖率: 76.87% → 95%
- 预估时间: 持续

## 成功指标

### 当前状态
```
总测试数: 320个
通过: 104个 (32.5%)
失败: 207个 (64.7%)
行覆盖率: 76.87%
函数覆盖率: 80.11%
```

### 目标状态
```
总测试数: ≥350个
通过: ≥332个 (≥95%)
失败: ≤17个 (≤5%)
行覆盖率: ≥95%
函数覆盖率: ≥95%
```

## 下一步行动

1. ✅ **计划已创建** - `.sisyphus/plans/test-quality-improvement.md`
2. ⏳ **等待用户确认** - 用户可以review计划后执行
3. ⏳ **执行计划** - 运行 `/start-work` 开始执行

## Git 提交记录

- **会话开始**: 2026-02-27
- **计划文件**: `.sisyphus/plans/test-quality-improvement.md`
- **草案文件**: `.sisyphus/drafts/test-planning-session.md`
