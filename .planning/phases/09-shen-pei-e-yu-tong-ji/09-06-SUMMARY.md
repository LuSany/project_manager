---
phase: 09-shen-pei-e-yu-tong-ji
plan: 06
subsystem: approval-flow, quota-management
tags: [approval, quota, booking]
dependency_graph:
  requires:
    - 09-01 (approval-flow)
    - 09-02 (quota)
  provides:
    - booking-with-approval
    - booking-with-quota-check
  affects:
    - POST /api/v1/bookings
    - BookingCreatePopover

tech_stack:
  added:
    - getApprovalConfigByDeviceType
    - startApprovalChain
    - checkWarningThresholds
  patterns:
    - Approval-triggered booking status
    - Quota warning notification

key_files:
  created: []
  modified:
    - src/app/api/v1/bookings/route.ts
    - src/components/devices/BookingCreatePopover.tsx

decisions:
  - D-09: Mixed approach - BookingStatus gets PENDING_APPROVAL, approval_records track chain
  - D-12: Quota check runs after conflict check, before booking creation
  - D-30: Warning notifications sent at 50%, 80%, 100% thresholds
  - D-32: Approval and quota notifications use existing notification system

metrics:
  duration: 10 minutes
  completed: 2026-03-31
---

# Phase 09 Plan 06: 审批配额与统计 - Summary

## 概述

将审批流程和配额检查集成到现有的 booking POST 端点中。这是关键集成点 — 连接了 Plans 01-02 构建的后端 API 与 D-09（混合方法）的预订创建流程。

## 实现内容

### 1. 审批流程集成 (Task 1)

修改 `src/app/api/v1/bookings/route.ts`:

- 在冲突检查之后、创建预订之前，检查设备类型是否需要审批
- 使用 `getApprovalConfigByDeviceType(deviceTypeId)` 查询审批配置
- 如果存在审批配置:
  - 将预订状态设置为 `PENDING_APPROVAL`
  - 调用 `startApprovalChain(bookingId, deviceTypeId)` 启动审批链
  - 创建审批记录并通知第一级审批人
- 如果没有审批配置:
  - 保持现有行为（状态为 `RESERVED`）
  - 同步更新设备状态为已预约

### 2. 配额检查集成 (Task 2)

在预订创建后添加配额检查:

- 使用 `checkWarningThresholds(projectId)` 检查配额使用情况
- 当配额超过 50%/80%/100% 阈值时触发警告通知
- 警告通知发送给项目负责人和项目成员

### 3. 前端状态显示 (Task 3)

更新 `src/components/devices/BookingCreatePopover.tsx`:

- 预订创建成功后，检查响应中的 `approval` 数据
- 如果 `approval.needsApproval === true`: 显示"预定已提交，等待审批"提示
- 如果 `approval.needsApproval === false`: 显示"预定成功"提示

## 验收标准验证

- ✅ `grep "PENDING_APPROVAL" src/app/api/v1/bookings/route.ts` → 找到
- ✅ `grep "getApprovalConfigByDeviceType" src/app/api/v1/bookings/route.ts` → 找到
- ✅ `grep "startApprovalChain" src/app/api/v1/bookings/route.ts` → 找到
- ✅ `grep "checkWarningThresholds" src/app/api/v1/bookings/route.ts` → 找到
- ✅ `grep "needsApproval" src/components/devices/BookingCreatePopover.tsx` → 找到

## 偏差说明

### 自动修复问题

**无偏差** — 计划按预期执行。

### 已知存根

无存根。功能完整实现。

## 提交记录

| 任务     | 提交哈希 | 说明                             |
| -------- | -------- | -------------------------------- |
| Task 1-3 | 38b3b7f  | 集成审批流程和配额检查到预订创建 |

## 完成时间

- 开始: 2026-03-31
- 结束: 2026-03-31
- 持续: ~10 分钟
