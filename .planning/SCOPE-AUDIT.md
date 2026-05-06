# FINAL AUDIT: 范围一致性检查报告

**审计日期:** 2026-05-06
**审计范围:** HEAD~21 (21 个提交)
**审计任务:** Task 2 (middleware), Task 5 (Rate Limiting), Task 7 (API Response), Task 8 (Transaction)

---

## 执行摘要

| 维度 | 结果 |
|------|------|
| Tasks 审计 | 4/4 |
| 范围污染 | **CONTAMINATION [3]** |
| VERDICT | **REJECT — 需清理后重新提交** |

### 关键发现

- **Task 2**: 104 文件变更 — 完整的认证架构迁移，远超"仅移除绕过"
- **Task 5**: middleware.ts 内混入 CSRF 函数 + XSS 头，不属于限流范围
- **Task 7**: 响应格式统一中混入 auth helper 导入整合
- **Task 8**: 事务包装正确，但 approval-flow 重构超出"仅添加包装"

---

## 详细分析

### 21 提交映射表

| # | Commit | 描述 | 审计状态 |
|---|--------|------|---------|
| 1 | 336e9d8 | refactor: 拆分巨型组件文件 | 未审计 |
| 2 | d9d3257 | feat(db): 复合索引 | 未审计 |
| 3 | 83e2e58 | refactor(cleanup): 移除 console.log | 未审计 |
| 4 | 8a22979 | refactor(types): 消除 as any | 未审计 |
| 5 | 0352829 | feat(performance): 动态导入 | 未审计 |
| 6 | af45339 | feat(api): 分页大小上限 | 未审计 |
| 7 | e8bbc41 | refactor(api): 提取 auth-helpers | 未审计 |
| **8** | **8574f48** | **refactor(api): 统一 API 响应格式** | **⚠️ CONTAMINATED** |
| 9 | 734ea72 | feat(security): CSRF 保护 | 未审计 |
| **10** | **6198688** | **feat(middleware): Rate Limiting** | **⚠️ CONTAMINATED** |
| **11** | **3b7d3eb** | **refactor(api): Prisma 事务保护** | **✓ APPROVED** |
| 12 | d01d577 | security(files): MIME 绕过修复 | 未审计 |
| 13 | c5f06bd | refactor: 合并 Prisma 导出 | 未审计 |
| **14** | **99467c3** | **fix(middleware): JWT 强制认证** | **⚠️ CONTAMINATED** |
| 15 | d1aa800 | fix(boardStore): boardId 逻辑 | 未审计 |
| 16 | 052c8a9 | fix(test): AI 测试模型名 | 未审计 |
| 17 | aaf166a | fix(test): jest-dom 扩展 | 未审计 |
| 18 | 9554646 | fix(test): risk 测试修复 | 未审计 |
| 19 | 099d29f | fix(test): 分离配置 | 未审计 |
| 20 | 671bf0f | fix(onlyoffice): 启动脚本 | 未审计 |
| 21 | e3f12d4 | docs: 统一编号格式 | 未审计 |

> **注:** 未找到对应这 21 个 task 的形式化 PLAN 文件。Phase 08 的 7 个子计划 (08-00 至 08-06) 均为设备管理 MVP 相关，与这些基础设施提交无关。上述任务编号基于提交在 git log 中的位置（由新到旧）。

---

## Task-by-Task 分析

### Task 2 (Commit #14): middleware JWT 强制认证

**Plan 期望:**
> 仅移除绕过逻辑，未改变其他

**实际变更:**
| 指标 | 数值 |
|------|------|
| 变更文件 | **104** |
| API 路由 | 102 |
| 新增文件 | 1 (get-auth-user.ts) |
| middleware diff | -68 行 |

**变更内容分解:**

1. **Middleware 层 (src/middleware.ts):**
   - ✅ 移除了 cookie-only bypass 逻辑 (`// 如果只有 cookie，直接继续请求`)
   - ❌ 同时移除了整个 cookie 设置机制 (user-id, user-email, user-role cookie 设置被删除)
   - ❌ 重构了认证流程：cookie 并行检查 → JWT 唯一路径
   - ❌ 错误消息变更

2. **API 路由层 (102 个文件):**
   - 每个路由的 `getAuthUser` 辅助函数从 cookie 读取改为 JWT token 提取
   - 变更模式: `request.cookies.get('user-id')?.value` → `getAuthUserIdentity(request)`
   - Login/Register/Forgot/Reset 路由有更大幅重构 (每个 36-47 行变更)

3. **新增文件:**
   - `src/lib/auth/get-auth-user.ts`: 58 行 JWT 用户提取函数

**污染分析:**

| 类别 | 判定 | 说明 |
|------|------|------|
| 绕过移除 | ✅ | 已完成 |
| Cookie 机制移除 | ⚠️ 必要级联 | 移除 cookie 认证后，路由必须同步更新 |
| 102 路由更新 | ⚠️ 必要级联 | 不更新则路由全部断连 |
| 认证架构变更 | ❌ 超出范围 | "仅移除绕过" 不等于 "完全迁移认证机制" |

**严重度:** ⚠️ **WARNING** — 路由变更是 middleware 变更的必然级联效应，但任务描述低估了实际范围。应表述为 "移除 cookie-based 认证，全量迁移至 JWT-only 认证"。

---

### Task 5 (Commit #10): Rate Limiting 统一

**Plan 期望:**
> middleware 层统一，未修改 130 路由

**实际变更:**
| 指标 | 数值 |
|------|------|
| 变更文件 | **1** (middleware.ts) |
| 路由变更 | **0** ✅ |
| 插入行 | 129 |
| 删除行 | 7 |

**变更内容分解:**

1. **限流逻辑 (Rate Limiting):**
   - ✅ 导入 `apiRateLimit`, `authRateLimit`
   - ✅ 实现 `getClientIp()`, `getIdentifier()` 辅助函数
   - ✅ Auth 路由 10req/60s，其他 API 100req/60s
   - ✅ 429 响应 + X-RateLimit-* 头
   - ✅ 纯 middleware 层，未触及任何路由

2. **CSRF 代码 (范围污染):** ❌
   - 导入 `validateCSRFToken` from `@/lib/security`
   - 新增 `requireCSRF()` 函数 (~45 行)
   - CSRF token 获取、验证逻辑完整实现

3. **XSS 安全头 (范围污染):** ❌
   - `X-XSS-Protection: 1; mode=block` 添加到 4 处响应
   - 非限流相关的安全加固

**污染分析:**

| 类别 | 判定 | 说明 |
|------|------|------|
| Rate Limiting 实现 | ✅ | middleware 层纯净 |
| 未修改路由 | ✅ | 0 路由文件变更 |
| CSRF 函数 | ❌ 范围污染 | ~45 行属于 CSRF 任务 (Commit #9) |
| XSS 安全头 | ❌ 范围污染 | 4 处添加与限流无关 |

**严重度:** 🔴 **BLOCKER** — CSRF 代码应在 Commit #9 (734ea72) 中统一实现。当前两个提交都对 middleware.ts 中的 CSRF 代码有贡献 (Commit #10 添加函数定义，Commit #9 添加调用)，导致职责混乱。

```
Commit #10 (Rate Limit) → 添加 requireCSRF() 函数定义
Commit #9  (CSRF)       → 在中间件流程中调用 requireCSRF()
```

**应改为:**
```
Commit #10 → 仅限流逻辑 (无 CSRF/XSS)
Commit #9  → requireCSRF 定义 + 调用 (完整的 CSRF 功能)
```

---

### Task 7 (Commit #8): API 响应格式统一

**Plan 期望:**
> 格式统一，未改变业务逻辑

**实际变更:**
| 指标 | 数值 |
|------|------|
| 变更文件 | **6** |
| 类型定义 | 1 (api.ts) |
| 响应工具 | 1 (response.ts) |
| API 路由 | 4 (tasks, requirements, devices, bookings) |
| 插入行 | 111 |
| 删除行 | 179 (净减少) |

**变更内容分解:**

1. **响应格式统一:** ✅
   - `ApiResponse` 添加 `meta?: PaginationMeta` 字段
   - 新增 `ApiResponder.paginated()` 方法
   - 4 个路由: `NextResponse.json({success, data: {items,...}})` → `ApiResponder.paginated(items, meta)`
   - 单条响应: `ApiResponder.created(data)`, `ApiResponder.unauthorized(msg)` 等
   - 业务逻辑未变 ✅

2. **Auth Helper 整合 (范围污染):** ❌
   - 路由中的内联 `getAuthUser` 函数 → `import { getAuthUser } from '@/lib/auth-helpers'`
   - 路由中的内联 `getUserProjectIds` → `import { getUserProjectIds } from '@/lib/auth-helpers'`
   - 这是 Commit #7 (e8bbc41) 的工作，不应在此 commit 中

**污染分析:**

| 类别 | 判定 | 说明 |
|------|------|------|
| 响应格式 ApiResponder | ✅ | 格式统一完成 |
| PaginationMeta 类型 | ✅ | 新结构清晰 |
| 业务逻辑变更 | ✅ | 无 - 纯格式转换 |
| Auth import 整合 | ❌ 范围污染 | 属于 auth-helpers 重构 (Commit #7) |

**严重度:** ⚠️ **WARNING** — Auth import 变更是"顺带"操作。虽然改动量小（每个路由删除 6-15 行内联函数定义），但破坏了单任务单提交的原则。该变更本应在 Commit #7 (e8bbc41) 中完成，当时已更新了 59 个其他路由。

---

### Task 8 (Commit #11): Prisma 事务保护

**Plan 期望:**
> 仅添加 $transaction 包装

**实际变更:**
| 指标 | 数值 |
|------|------|
| 变更文件 | **4** |
| API 路由 | 3 (bookings, requirements/[id], tasks/[id]) |
| 业务逻辑 | 1 (approval-flow.ts) |
| 插入行 | 183 |
| 删除行 | 88 |

**变更内容分解:**

1. **$transaction 包装:** ✅
   - `bookings/route.ts`: 预定创建 + 审批链 + 设备状态 → 单个 $transaction
   - `requirements/[id]/route.ts`: 需求更新 + 历史记录 → $transaction (Promise.all → 顺序事务)
   - `tasks/[id]/route.ts`: 负责人删除/创建 + 任务更新 → $transaction

2. **approval-flow.ts 重构:** ⚠️ 必要前置
   - 新增 `startApprovalChainTransaction(tx, bookingId, deviceTypeId)` — 事务内版本
   - 新增 `notifyApprovalChain(...)` — 事务外通知版本
   - 保留原 `startApprovalChain` 不变
   - 原因: 原始函数混合了数据库写入和通知发送，无法安全放入事务

**污染分析:**

| 类别 | 判定 | 说明 |
|------|------|------|
| 3 路由 $transaction | ✅ | 事务包装正确 |
| approval-flow 拆分 | ⚠️ 必要前置 | 不拆分则通知失败回滚业务数据 |
| 业务逻辑变更 | ✅ | 无 - 仅重构执行顺序 |

**严重度:** ✅ **APPROVED** — approval-flow 重构是事务安全的必要前提。原始代码 `startApprovalChain` 在同一个函数中混合了 DB 写入和通知发送，这样的函数无法安全地放入 `$transaction`（通知失败会导致业务回滚）。拆分为事务内（`startApprovalChainTransaction`）和事务外（`notifyApprovalChain`）是规范的工程实践。

**备注:** 任务描述"仅添加 $transaction 包装"不准确。实际还需重构依赖函数的内部结构。建议改为"为多步数据修改添加事务保护，确保原子性"。

---

## 范围污染总览

| Task | Commit | 预期范围 | 实际范围 | 污染 | 严重度 |
|------|--------|---------|---------|------|--------|
| 2 | 99467c3 | 仅移除绕过 | 104 文件 (完整认证迁移) | 级联变更 | ⚠️ WARNING |
| 5 | 6198688 | middleware 限流 | +CSRF 函数 +XSS 头 | 直接污染 | 🔴 BLOCKER |
| 7 | 8574f48 | 响应格式 | +auth import 整合 | 顺带变更 | ⚠️ WARNING |
| 8 | 3b7d3eb | $transaction 包装 | +approval-flow 拆分 | 必要前置 | ✅ APPROVED |

---

## 全局统计

```
Tasks 审计:  [4/21]
范围纯净:   [1/4]   (Task 8)
范围警告:   [2/4]   (Task 2, Task 7)
范围污染:   [1/4]   (Task 5)
```

### QA 验证

```bash
git diff HEAD~21 HEAD --stat
# 结果: 174 files, +4713 / -4261
# 评价: 变更量合理（净增 452 行），但文件数偏高
# 主要原因: Task 2 触及 102 个 API 路由（每个路由 ~3 行变更）
```

---

## 修复建议

### Task 5 (优先修复)

1. **从 middleware.ts 移除 CSRF 代码:**
   - 删除 `requireCSRF()` 函数
   - 删除 `import { validateCSRFToken }`
   - 删除 `X-XSS-Protection` 头设置
   - 将这些代码移至 Commit #9 (734ea72)

2. **合并 CSRF 实现:**
   - Commit #9 应包含完整的 CSRF 功能（定义 + 调用 + 测试）
   - XSS 头应独立为一个安全加固提交

### Task 7

3. **auth import 整合应在 Commit #7 中完成:**
   - Commit #7 (e8bbc41) 已更新 59 个路由使用 auth-helpers
   - 遗漏的 4 个路由（tasks, requirements, devices, bookings）应在该 commit 中同步更新

### Task 2

4. **更新任务描述:**
   - 当前描述 "仅移除绕过逻辑" 低估了实际变更范围
   - 应改为 "强制 JWT 认证：移除 cookie bypass，全量迁移至 Bearer Token 认证"
   - 或拆分为两个提交：(a) middleware 变更 (b) 路由适配

---

## VERDICT

```
Tasks  [4/4]  |  Contamination  [3]  |  VERDICT:  REJECT
```

**拒绝原因:** Task 5 存在直接范围污染（CSRF 代码和 XSS 头混入限流提交）。需清理后重新审计。

---

_审计完成: 2026-05-06_
_审计工具: gsd-verifier (Claude)_
