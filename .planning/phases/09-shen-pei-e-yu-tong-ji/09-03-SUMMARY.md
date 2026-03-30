---
phase: 09-shen-pei-e-yu-tong-ji
plan: 03
subsystem: equipment-stats
tags:
  - api
  - equipment
  - statistics
  - excel-export
  - xlsx

dependency_graph:
  requires:
    - 09-00 (Phase 00 initialization)
  provides:
    - /api/v1/equipment/stats/* endpoints
    - src/lib/equipment-stats.ts library
  affects:
    - Frontend stats page (Plan 05)
    - Excel export functionality

tech_stack:
  added:
    - xlsx v0.18.5 (existing from 09-00)
  patterns:
    - Promise.all parallel queries
    - groupBy aggregation
    - Pagination with skip/take
    - Excel file streaming download
    - success/error response pattern

key_files:
  created:
    - src/types/equipment-stats.ts (Type definitions)
    - src/lib/equipment-stats.ts (Aggregation logic)
    - src/app/api/v1/equipment/stats/route.ts (Overview endpoint)
    - src/app/api/v1/equipment/stats/project-hours/route.ts
    - src/app/api/v1/equipment/stats/device-utilization/route.ts
    - src/app/api/v1/equipment/stats/usage-records/route.ts
    - src/app/api/v1/equipment/stats/export/route.ts
  modified:
    - tests/lib/equipment-stats.test.ts (Updated with real tests)

decisions:
  - D-14: Project hours aggregation by month with top N ranking
  - D-15: Device utilization calculated as used-hours / available-hours (12h/day)
  - D-16: Usage records with filtering and pagination
  - D-23: Only count RESERVED/IN_PROGRESS/COMPLETED bookings (not CANCELLED/PENDING_APPROVAL)
  - D-25: Stats page provides three views
  - D-26: Daily trend for charts
  - D-27: Independent xlsx library (NOT extending report-generator.ts)
  - D-28: Working hours 8:00-20:00 = 12h/day
  - D-29: Filter support for project/device/user/date-range

metrics:
  duration: ~30 minutes
  completed: 2026-03-31
  tasks: 5
  files_created: 7
  files_modified: 1
  commits: 2
---

# Phase 9 Plan 3: 设备统计 API 实现总结

## 概述

本计划实现了设备统计 API，包含 4 个核心统计端点和 1 个 Excel 导出端点。使用独立的 xlsx 库进行 Excel 生成（遵循 D-27 决策），不扩展 report-generator.ts。

## 实现的功能

### 1. 统计概览端点

- **路由**: `GET /api/v1/equipment/stats`
- **返回**: 当月总预定数、总使用机时数、活跃设备数、总设备数

### 2. 项目机时统计

- **路由**: `GET /api/v1/equipment/stats/project-hours`
- **参数**: `month` (yyyy-MM), `topN` (默认 10)
- **返回**: 按项目分组的机时汇总，按使用量降序排列
- **计算逻辑**: 仅统计 RESERVED/IN_PROGRESS/COMPLETED 状态 (D-23)

### 3. 设备使用率统计

- **路由**: `GET /api/v1/equipment/stats/device-utilization`
- **参数**: `startDate`, `endDate`, `deviceTypeId` (可选)
- **返回**: 每台设备的使用率、使用时长、可用时长、每日趋势
- **计算逻辑**: 12小时/天 (D-28), 使用率 = 使用时长 / 可用时长 \* 100

### 4. 使用记录查询

- **路由**: `GET /api/v1/equipment/stats/usage-records`
- **参数**: `projectId`, `deviceId`, `userId`, `startDate`, `endDate`, `page`, `pageSize`, `sortBy`, `sortOrder`
- **返回**: 分页的使用记录列表
- **默认排序**: startTime 降序

### 5. Excel 导出

- **路由**: `GET /api/v1/equipment/stats/export`
- **参数**: `type` (必需: project-hours | device-utilization | usage-record), 及其他筛选参数
- **返回**: .xlsx 文件下载
- **实现**: 使用独立 xlsx 库 (D-27)，包含中文表头

## 验收标准完成情况

| 标准                                                              | 状态              |
| ----------------------------------------------------------------- | ----------------- |
| `src/app/api/v1/equipment/stats/route.ts` 存在                    | ✅                |
| `src/app/api/v1/equipment/stats/project-hours/route.ts` 存在      | ✅                |
| `src/app/api/v1/equipment/stats/device-utilization/route.ts` 存在 | ✅                |
| `src/app/api/v1/equipment/stats/usage-records/route.ts` 存在      | ✅                |
| `src/app/api/v1/equipment/stats/export/route.ts` 存在             | ✅                |
| `src/lib/equipment-stats.ts` 存在                                 | ✅                |
| TypeScript 编译无错误                                             | ✅ (新文件无错误) |

## Deviation 记录

无 - 计划完全按设计执行。

## 后续计划

- Plan 04: 预警通知系统 (配额预警 50%/80%/100%)
- Plan 05: 统计前端页面 (图表展示)
