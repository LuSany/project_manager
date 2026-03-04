# 测试计划补充说明 v1.1

**文档版本**: v1.1  
**创建日期**: 2026-03-04  
**补充内容**: 遗漏模块 + 提升覆盖率标准 + 通过率保障

---

## 一、覆盖率标准提升

### 1.1 提升后的覆盖率目标

| 优先级 | 模块类型       | 原目标 | **新目标** | 提升 | 验证方式 |
| ------ | -------------- | ------ | ---------- | ---- | -------- |
| P0     | 核心业务模型   | 100%   | **100%**   | -    | 强制门禁 |
| P1     | 重要业务模型   | 95%    | **98%**    | +3%  | CI 检查  |
| P2     | 支撑服务模型   | 90%    | **95%**    | +5%  | CI 检查  |
| P3     | 基础设施模型   | 85%    | **90%**    | +5%  | CI 检查  |
| -      | **总体覆盖率** | 92%    | **95%**    | +3%  | 发布门禁 |

### 1.2 新增质量指标

| 指标               | 目标值    | 测量方式          | 门禁位置 |
| ------------------ | --------- | ----------------- | -------- |
| **测试通过率**     | 100%      | 运行成功/总运行数 | CI/CD    |
| **Flaky 测试数**   | 0         | 随机失败测试数    | 每日检查 |
| **测试执行时间**   | < 20 分钟 | 完整测试套件耗时  | CI/CD    |
| **新增代码覆盖率** | 95%+      | 仅统计新增代码    | PR 检查  |
| **关键路径覆盖率** | 100%      | 核心业务流程      | 人工审核 |

### 1.3 Vitest 配置更新建议

```typescript
// vitest.config.ts 更新
export default defineConfig({
  test: {
    // ... 现有配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts', 'src/stores/**/*.ts'],
      exclude: ['src/types/**', '**/*.d.ts', '**/index.ts'],
      // 提升后的覆盖率目标
      thresholds: {
        statements: 95, // 90 → 95
        branches: 90, // 85 → 90
        functions: 95, // 90 → 95
        lines: 95, // 90 → 95

        // 新增：全局覆盖率门禁
        global: {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
      // 新增：覆盖率报告格式
      reportOnFailure: true, // 失败时也生成报告
    },

    // 新增：重试机制
    retry: 2, // 失败重试 2 次，减少 flaky

    // 新增：隔离性增强
    isolate: true, // 每个测试文件独立上下文
  },
})
```

---

## 二、遗漏模块补充计划

### 2.1 E2E 测试专项（新增）

**测试目录**: `tests/e2e/critical-flows/`

| 序号     | E2E 测试场景                      | 测试用例数 | 预计工时 | 优先级 |
| -------- | --------------------------------- | ---------- | -------- | ------ |
| E2E-01   | 用户注册 → 登录 → 创建项目        | 5          | 2h       | P0     |
| E2E-02   | 创建任务 → 分配 → 完成 → 验收     | 8          | 2h       | P0     |
| E2E-03   | 需求提出 → 审核 → 评估 → 验收     | 10         | 3h       | P0     |
| E2E-04   | 创建评审 → 上传材料 → 评审完成    | 8          | 2h       | P0     |
| E2E-05   | 风险识别 → 关联任务 → 缓解 → 关闭 | 6          | 2h       | P1     |
| E2E-06   | 文件上传 → 预览 → 编辑 → 下载     | 6          | 2h       | P1     |
| E2E-07   | 邮件发送 → 接收 → 点击链接 → 操作 | 5          | 2h       | P1     |
| E2E-08   | AI 分析 → 结果展示 → 应用建议     | 5          | 2h       | P2     |
| **小计** | **8 个核心流程**                  | **53**     | **15h**  | -      |

**E2E 测试技术要求**:

- 使用 Playwright 作为测试框架
- 每个测试独立数据库快照
- 测试后自动清理数据
- 支持 Headless 和 UI 两种模式
- 失败时自动截图

---

### 2.2 API 集成测试专项（新增）

**测试目录**: `tests/integration/api/`

| 序号     | API 模块          | 测试内容             | 用例数  | 工时    |
| -------- | ----------------- | -------------------- | ------- | ------- |
| API-01   | Auth API          | 登录、注册、密码找回 | 15      | 2h      |
| API-02   | Projects API      | CRUD、成员管理       | 20      | 2h      |
| API-03   | Tasks API         | CRUD、状态流转、依赖 | 25      | 3h      |
| API-04   | Requirements API  | 审核流程、变更       | 20      | 2h      |
| API-05   | Reviews API       | 评审流程、AI 分析    | 20      | 2h      |
| API-06   | Files API         | 上传、预览、下载     | 15      | 2h      |
| API-07   | Notifications API | 通知、偏好设置       | 10      | 1h      |
| API-08   | Admin API         | 配置管理、审计日志   | 15      | 2h      |
| **小计** | **8 个 API 模块** | **OpenAPI 合规**     | **140** | **16h** |

**API 测试技术要求**:

- 基于 OpenAPI Schema 验证响应
- 验证所有 HTTP 状态码
- 验证响应时间 < 500ms (P95)
- 验证错误响应格式一致性
- 验证认证/授权逻辑

---

### 2.3 安全测试专项（新增）

**测试目录**: `tests/security/`

| 序号     | 安全测试类型     | 测试场景                       | 用例数 | 工时    |
| -------- | ---------------- | ------------------------------ | ------ | ------- |
| SEC-01   | 认证安全         | JWT 伪造、Token 过期、会话劫持 | 10     | 2h      |
| SEC-02   | 授权验证         | 越权访问、角色权限、资源隔离   | 15     | 2h      |
| SEC-03   | SQL 注入         | Prisma 参数化查询验证          | 8      | 1h      |
| SEC-04   | XSS 防护         | 输入过滤、输出转义             | 10     | 2h      |
| SEC-05   | CSRF 防护        | Token 验证、同源策略           | 5      | 1h      |
| SEC-06   | 文件上传安全     | 类型验证、大小限制、病毒扫描   | 10     | 2h      |
| SEC-07   | 敏感数据保护     | 密码加密、PII 脱敏             | 8      | 1h      |
| SEC-08   | 速率限制         | 暴力破解防护、DDoS 防护        | 5      | 1h      |
| **小计** | **8 类安全测试** | **OWASP Top 10**               | **71** | **12h** |

**安全测试工具**:

- OWASP ZAP 自动化扫描
- SQLMap 注入测试
- XSS Payload 测试库
- 自定义安全测试脚本

---

### 2.4 性能测试专项（新增）

**测试目录**: `tests/performance/`

| 序号     | 性能测试场景     | 并发数            | 目标 RT      | 用例数 | 工时    |
| -------- | ---------------- | ----------------- | ------------ | ------ | ------- |
| PERF-01  | 用户登录         | 100               | < 200ms      | 5      | 1h      |
| PERF-02  | 项目列表查询     | 200               | < 300ms      | 5      | 1h      |
| PERF-03  | 任务创建         | 100               | < 500ms      | 5      | 1h      |
| PERF-04  | 报告生成         | 10                | < 5s         | 5      | 2h      |
| PERF-05  | 文件上传 (10MB)  | 20                | < 3s         | 5      | 1h      |
| PERF-06  | AI 分析请求      | 50                | < 2s         | 5      | 2h      |
| PERF-07  | 数据库批量查询   | 100               | < 1s         | 5      | 1h      |
| PERF-08  | 缓存命中率测试   | -                 | > 80%        | 5      | 2h      |
| PERF-09  | 压力测试 (峰值)  | 500               | < 3s         | 5      | 3h      |
| PERF-10  | 稳定性测试 (24h) | 100               | < 1s         | 5      | 4h      |
| **小计** | **10 个场景**    | **最高 500 并发** | **P95 < 1s** | **50** | **18h** |

**性能测试工具**:

- k6 或 Artillery 负载生成
- Prometheus + Grafana 监控
- 数据库性能分析

---

### 2.5 兼容性测试专项（新增）

**测试目录**: `tests/compatibility/`

| 序号     | 兼容性测试           | 测试内容                   | 用例数 | 工时    |
| -------- | -------------------- | -------------------------- | ------ | ------- |
| COMP-01  | SQLite vs PostgreSQL | 数据类型、查询语法、事务   | 20     | 3h      |
| COMP-02  | 数据库版本兼容       | PostgreSQL 14/15/16        | 10     | 2h      |
| COMP-03  | Node.js 版本兼容     | Node 18/20/22              | 10     | 2h      |
| COMP-04  | 浏览器兼容 (E2E)     | Chrome/Firefox/Safari/Edge | 20     | 4h      |
| COMP-05  | 操作系统兼容         | Linux/macOS/Windows        | 10     | 2h      |
| **小计** | **5 类兼容测试**     | **多环境验证**             | **70** | **13h** |

---

### 2.6 测试数据工厂（新增基础设施）

**文件**: `tests/helpers/test-data-factory.ts`

```typescript
// 测试数据工厂设计
export const factory = {
  // User 工厂
  user: (overrides?: Partial<User>) => create<User>('User', overrides),

  // Project 工厂（自动关联 User）
  project: (overrides?: Partial<Project>) => create<Project>('Project', overrides),

  // Task 工厂（自动关联 Project, User）
  task: (overrides?: Partial<Task>) => create<Task>('Task', overrides),

  // ... 47 个模型的工厂方法
}

// 使用示例
const user = await factory.user({ email: 'test@example.com' })
const project = await factory.project({ ownerId: user.id })
const task = await factory.task({
  projectId: project.id,
  assigneeId: user.id,
})
```

**预计工时**: 8h  
**测试用例**: 50 (每个工厂方法 1-2 个测试)

---

## 三、通过率保障措施

### 3.1 Flaky 测试管理

**定义**: 相同代码，有时通过有时失败的测试

**检测机制**:

```yaml
# CI/CD 配置
flaky-detection:
  run: 每个测试运行 5 次
  threshold: 失败率 > 20% 标记为 flaky
  action: 自动隔离，通知负责人
```

**管理流程**:

1. 自动检测 → 标记为 flaky
2. 移至 `tests/flaky/` 目录
3. 72 小时内修复
4. 修复后移回原目录

**目标**: Flaky 测试 = 0

---

### 3.2 测试超时处理

| 测试类型 | 超时时间 | 处理策略                 |
| -------- | -------- | ------------------------ |
| 单元测试 | 5 秒     | 立即失败，标记为性能问题 |
| 集成测试 | 30 秒    | 重试 2 次，仍失败则隔离  |
| E2E 测试 | 60 秒    | 截图 + 视频，重试 1 次   |
| 性能测试 | 300 秒   | 记录性能指标，不重试     |

---

### 3.3 测试数据隔离

**策略**: 每个测试文件独立数据库

```typescript
// tests/helpers/test-db.ts
export async function setupTestDatabase() {
  // 创建临时数据库
  const dbName = `test_${crypto.randomUUID()}`
  await createDatabase(dbName)

  // 运行迁移
  await runMigrations(dbName)

  return {
    url: `postgresql://.../${dbName}`,
    cleanup: () => dropDatabase(dbName),
  }
}

// 每个测试文件使用
beforeAll(async () => {
  const db = await setupTestDatabase()
  globalThis.TEST_DB = db
})

afterAll(async () => {
  await globalThis.TEST_DB.cleanup()
})
```

---

### 3.4 测试失败重试机制

**配置**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    retry: 2, // 自动重试 2 次

    // 重试间隔指数退避
    retryDelay: (retryCount) => {
      return Math.pow(2, retryCount) * 100 // 100ms, 200ms, 400ms
    },
  },
})
```

**规则**:

- 仅适用于网络请求、数据库操作
- 纯逻辑测试不重试（立即失败）
- 重试失败后标记为「间歇性失败」

---

### 3.5 CI/CD 集成验证

**GitHub Actions 配置**:

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run typecheck

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Check coverage thresholds
        run: npm run test:coverage:check
        env:
          COVERAGE_THRESHOLD: 95

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Check for flaky tests
        run: npm run test:flaky:check

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

---

## 四、更新后的测试计划总览

### 4.1 完整测试用例统计

| 测试类别       | 原计划  | **新增** | **总计** | 工时     |
| -------------- | ------- | -------- | -------- | -------- |
| 核心业务模型   | 150     | -        | 150      | 12h      |
| 重要业务模型   | 100     | -        | 100      | 8h       |
| 支撑服务模型   | 80      | -        | 80       | 6h       |
| 基础设施模型   | 50      | -        | 50       | 4h       |
| 管理员后台     | 50      | -        | 50       | 6h       |
| 报告生成       | 40      | -        | 40       | 5h       |
| 缓存服务       | 25      | -        | 25       | 4h       |
| **E2E 测试**   | -       | **53**   | **53**   | **15h**  |
| **API 集成**   | -       | **140**  | **140**  | **16h**  |
| **安全测试**   | -       | **71**   | **71**   | **12h**  |
| **性能测试**   | -       | **50**   | **50**   | **18h**  |
| **兼容性测试** | -       | **70**   | **70**   | **13h**  |
| **数据工厂**   | -       | **50**   | **50**   | **8h**   |
| **总计**       | **495** | **434**  | **929**  | **107h** |

### 4.2 实施时间调整

**原计划**: 4 周 (45 小时)  
**新计划**: **8-10 周** (107 小时)

**阶段划分**:

| 阶段    | 内容                          | 工时 | 周期      |
| ------- | ----------------------------- | ---- | --------- |
| Phase 1 | P0 核心模型 + 管理员后台      | 18h  | Week 1-2  |
| Phase 2 | P1 重要模型 + 报告生成 + 缓存 | 17h  | Week 2-3  |
| Phase 3 | P2/P3 模型 + 数据工厂         | 18h  | Week 3-4  |
| Phase 4 | E2E 测试专项                  | 15h  | Week 4-5  |
| Phase 5 | API 集成测试                  | 16h  | Week 5-6  |
| Phase 6 | 安全测试专项                  | 12h  | Week 6-7  |
| Phase 7 | 性能测试专项                  | 18h  | Week 7-8  |
| Phase 8 | 兼容性测试 + 优化             | 13h  | Week 8-9  |
| Phase 9 | 验收 + 文档                   | 10h  | Week 9-10 |

---

## 五、验收标准更新

### 5.1 覆盖率验收（提升后）

- [ ] 总覆盖率 ≥ **95%** (原 92%)
- [ ] P0 核心模型覆盖率 = **100%**
- [ ] P1 重要模型覆盖率 ≥ **98%** (原 95%)
- [ ] P2 支撑模型覆盖率 ≥ **95%** (原 90%)
- [ ] P3 基础设施覆盖率 ≥ **90%** (原 85%)
- [ ] 新增代码覆盖率 ≥ **95%** (新增)

### 5.2 质量验收（新增）

- [ ] 测试通过率 = **100%**
- [ ] Flaky 测试数 = **0**
- [ ] 测试执行时间 < **20 分钟**
- [ ] 安全测试 0 高危漏洞
- [ ] 性能测试 P95 响应时间 < 1s
- [ ] E2E 核心流程 100% 通过

### 5.3 文档验收

- [ ] 测试计划文档完整
- [ ] 测试用例可追溯至需求
- [ ] 测试报告按时提交
- [ ] API 文档与实现一致

---

## 六、建议优先级

考虑到时间和资源限制，建议分阶段实施：

### 必做（P0 - 8 周内完成）

- ✅ 47 数据模型测试 (495 用例)
- ✅ E2E 核心流程测试 (53 用例)
- ✅ API 集成测试 (140 用例)
- ✅ 安全测试基础 (40 用例)

### 选做（P1 - 12 周内完成）

- ⚠️ 完整安全测试 (71 用例)
- ⚠️ 性能测试 (50 用例)
- ⚠️ 兼容性测试 (70 用例)

### 可选（P2 - 后续迭代）

- 🔜 浏览器兼容性全量测试
- 🔜 24 小时稳定性测试
- 🔜 混沌工程测试

---

**文档结束**

---

_创建日期_: 2026-03-04  
_版本_: v1.1  
_负责人_: AI Assistant  
_审核状态_: 待审核
