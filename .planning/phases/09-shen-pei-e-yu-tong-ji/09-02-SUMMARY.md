---
phase: 09-shen-pei-e-yu-tong-ji
plan: 02
subsystem: quota-management
tags: [quota, api, warning-notification]
dependency_graph:
  requires:
    - 09-00 (quota model in schema)
  provides:
    - src/lib/quota.ts (quota checking library)
    - src/app/api/v1/quotas/route.ts (quota CRUD)
    - src/app/api/v1/quotas/[id]/route.ts (quota detail)
  affects:
    - bookings flow (quota check on booking creation)
    - notification system
tech_stack:
  added:
    - date-fns (for month start/end calculations)
  patterns:
    - REST API with Next.js App Router
    - Zod validation
    - Prisma ORM queries
key_files:
  created:
    - src/lib/quota.ts
    - src/types/quota.ts
    - src/app/api/v1/quotas/route.ts
    - src/app/api/v1/quotas/[id]/route.ts
  modified:
    - tests/lib/quota-checking.test.ts
decisions:
  - D-12: Per-project quota with optional device-type sub-quotas
  - D-13: Machine-hours as quota unit
  - D-14: Monthly reset (period check from 1st to last day of month)
  - D-15: Sub-quotas sum ≤ total quota (validated on create/update)
  - D-19: Support sub-quotas per device type
  - D-20: Enforce sub-quotas sum ≤ total on save
  - D-21: Reset warning flags when totalHours changes
  - D-22: New project has no quota by default (no restriction without quota)
  - D-23: Quota calculated by actual usage, not booked time
  - D-30: Three-level warnings: 50%, 80%, 100%
  - D-34: Check on every booking creation
  - D-35: Each threshold notifies only once per period
metrics:
  duration: ~45 minutes
  completed_date: 2026-03-31
  files_created: 4
  files_modified: 1
  tests_passed: 11
---

# Phase 9 Plan 2: 审批配额与统计 - Summary

## 概述

实现配额管理 API 和配额预警通知系统。按 D-12~D-15, D-19, D-20, D-22, D-23, D-30, D-34, D-35 决策创建配额 CRUD 接口、配额使用计算、以及三级预警通知机制。

## 已完成功能

### 1. 配额检查库 (src/lib/quota.ts)

- **checkQuotaUsage(projectId)**: 计算项目当月配额使用量
  - 统计状态为 COMPLETED 或 IN_PROGRESS 的预订
  - 使用实际使用时间 (endTime - startTime) / 3600000 计算小时数
  - 过滤当月时间范围

- **getQuotaBreakdown(projectId)**: 返回配额使用详情含剩余时间

- **checkWarningThresholds(projectId)**: 检查并触发三级预警
  - 50% 通知 (warningSent50)
  - 80% 警告 (warningSent80)
  - 100% 超限 (warningSent100)
  - 每阈值每周期只通知一次

- **calculateRemainingHours(totalHours, usedHours)**: 计算剩余配额

- **calculatePercentage(usedHours, totalHours)**: 计算使用百分比

- **validateSubQuotas(totalHours, subItems)**: 验证子配额总和不超过总配额

### 2. 配额 CRUD API

- **GET /api/v1/quotas** — 获取配额列表
- **POST /api/v1/quotas** — 创建配额（含子配额验证）
- **GET /api/v1/quotas/[id]** — 获取配额详情
- **PUT /api/v1/quotas/[id]** — 更新配额（修改 totalHours 时重置预警标志）
- **DELETE /api/v1/quotas/[id]** — 删除配额

### 3. 类型定义 (src/types/quota.ts)

- createQuotaSchema / updateQuotaSchema (Zod)
- CreateQuotaRequest / UpdateQuotaRequest
- QuotaResponse / QuotaSubItem

### 4. 测试

- 11 个单元测试通过
- 测试覆盖：剩余时间计算、百分比计算、子配额验证

## 验收标准达成

- [x] `src/app/api/v1/quotas/route.ts` 存在且包含 GET/POST
- [x] `src/app/api/v1/quotas/[id]/route.ts` 存在且包含 GET/PUT/DELETE
- [x] `src/lib/quota.ts` 包含 checkQuotaUsage, getQuotaBreakdown, checkWarningThresholds
- [x] `src/lib/notification.ts` 包含 notifyQuotaWarning (已在之前实现)
- [x] 所有测试通过 (11 tests)
- [x] TypeScript 编译无错误

## Deviations from Plan

无偏差 - 计划按预期执行。

## Known Stubs

无存根 - 所有功能完整实现。

## Auth Gates

无认证门 - 管理功能使用 cookie 认证，与现有模式一致。
