---
phase: 09-shen-pei-e-yu-tong-ji
plan: 00
subsystem: approval-and-quota
tags: [approval, quota, prisma-schema, notification]
dependency_graph:
  requires: []
  provides:
    - model: approval_configs
      description: 审批配置模型 - 存储设备类型的审批人配置
    - model: approval_records
      description: 审批记录模型 - 存储审批流程的执行记录
    - model: quotas
      description: 配额模型 - 存储项目的机时配额
    - model: quota_sub_items
      description: 子配额模型 - 存储按设备类型的子配额
    - enum: BookingStatus.PENDING_APPROVAL
      description: 新的预定状态 - 待审批
    - enum: NotificationType (扩展5个新类型)
      description: 审批和配额相关通知类型
  affects:
    - src/app/api/v1/bookings/route.ts
    - src/lib/notification.ts
    - src/stores/
tech_stack:
  added:
    - xlsx (^0.18.5) - Excel 导出库
  patterns:
    - 审批配置按设备类型设置，支持多级串行审批
    - 配额按项目维度管理，支持按设备类型子配额
    - 三级预警通知机制 (50%/80%/100%)
key_files:
  created:
    - tests/lib/approval-flow.test.ts
    - tests/lib/quota-checking.test.ts
    - tests/lib/equipment-stats.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/notification.ts
    - package.json
decisions:
  - D-01: 单级 + 可选多级串行审批
  - D-02: 按设备类型配置审批人
  - D-09: BookingStatus 新增 PENDING_APPROVAL
  - D-11: 双向通知机制
  - D-12: 按项目配额 + 可选按设备类型子配额
  - D-14: 月度配额，每月重置
  - D-30: 固定三级预警 (50%/80%/100%)
  - D-31: 站内通知扩展
---

# Phase 9 Plan 00: 审批配额与统计 - 基础架构

## 执行摘要

本计划为 Phase 9（审批配额与统计）建立了数据库 schema 基础架构，包括审批流程模型、配额管理模型、通知类型扩展和测试 stubs。这些是后续 Plans 01-06 工作的基石。

## 完成的工作

### 1. Prisma Schema 扩展

#### 1.1 BookingStatus 枚举扩展

- 添加 `PENDING_APPROVAL` 到枚举值列表第一位（作为审批流程的初始状态）

#### 1.2 NotificationType 枚举扩展

- 添加 5 个新值：`APPROVAL_REQUEST`, `APPROVAL_APPROVED`, `APPROVAL_REJECTED`, `QUOTA_WARNING`, `QUOTA_EXCEEDED`

#### 1.3 新增模型

**approval_configs（审批配置）**

- `id`: 主键
- `deviceTypeId`: 关联的设备类型（唯一）
- `levels`: 审批级数（默认 1）
- `approverIds`: JSON 字符串，存储每级的审批人列表
- 关系：与 device_types 一对一

**approval_records（审批记录）**

- `id`: 主键
- `bookingId`: 关联的预定
- `approverId`: 审批人
- `level`: 当前审批级别
- `action`: 操作（APPROVED/REJECTED/FORWARDED）
- `comment`: 审批意见
- 关系：与 bookings 多对一，与 users 多对一

**quotas（配额）**

- `id`: 主键
- `projectId`: 关联的项目（唯一）
- `totalHours`: 总机时
- `period`: 周期（默认 MONTHLY）
- `warningSent50/warningSent80/warningSent100`: 预警标志
- 关系：与 projects 一对一

**quota_sub_items（子配额）**

- `id`: 主键
- `quotaId`: 关联的配额
- `deviceTypeId`: 关联的设备类型
- `subHours`: 子配额小时数
- 关系：与 quotas 多对一，与 device_types 多对一

#### 1.4 现有模型关系扩展

- `device_types`: 添加 `approvalConfig` 和 `quotaSubItems` 关系
- `bookings`: 添加 `approvalRecords` 关系
- `projects`: 添加 `quota` 关系
- `users`: 添加 `approvalRecords` 关系

### 2. Notification.ts 扩展

#### 2.1 类型扩展

- `NotificationType` 联合类型添加 5 个新值

#### 2.2 新增通知函数

- `notifyApprovalRequest()` - 审批请求通知
- `notifyApprovalResult()` - 审批结果通知（通过/驳回）
- `notifyQuotaWarning()` - 配额预警通知（支持 50%/80%/100% 阈值）

### 3. 依赖安装

- 安装 `xlsx` ^0.18.5 用于 Excel 导出功能

### 4. 测试 Stubs

创建了 3 个测试文件，包含 40 个 it.todo() 测试用例：

- `tests/lib/approval-flow.test.ts` - 14 个测试用例
- `tests/lib/quota-checking.test.ts` - 14 个测试用例
- `tests/lib/equipment-stats.test.ts` - 12 个测试用例

## 验证结果

| 验收标准                                             | 状态 |
| ---------------------------------------------------- | ---- |
| `grep "PENDING_APPROVAL" prisma/schema.prisma`       | ✅   |
| `grep "APPROVAL_REQUEST" prisma/schema.prisma`       | ✅   |
| `grep "QUOTA_EXCEEDED" prisma/schema.prisma`         | ✅   |
| `grep "model approval_configs" prisma/schema.prisma` | ✅   |
| `grep "model approval_records" prisma/schema.prisma` | ✅   |
| `grep "model quotas" prisma/schema.prisma`           | ✅   |
| `grep "model quota_sub_items" prisma/schema.prisma`  | ✅   |
| `grep '"xlsx"' package.json`                         | ✅   |
| `npx prisma validate`                                | ✅   |
| 测试文件存在                                         | ✅   |

## 问题与说明

### LSP 假阳性

- notification.ts 在 LSP 中显示类型错误，这是 LSP 缓存问题，实际 TypeScript 编译通过（`npx tsc --noEmit` 无该文件错误）

### 预存在的编译错误

- 项目存在一些预先存在的测试文件编译错误（与 ai_configs 相关的属性名称问题等），不在本计划范围内

## 下一步

本计划创建的基础架构为以下后续计划提供支持：

- Plan 01: 审批配置 API
- Plan 02: 审批流程 API
- Plan 03: 配额管理 API
- Plan 04: 配额检查逻辑
- Plan 05: 设备统计 API
- Plan 06: 统计页面

---

**执行时间**: 2026-03-30
**Commit**: feat(09-00): add approval and quota models to Prisma schema
