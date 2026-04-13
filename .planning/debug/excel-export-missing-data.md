---
status: diagnosed
trigger: "导出的Excel只有使用记录，缺少项目机时、设备使用率数据"
created: "2026-04-13T00:00:00.000Z"
updated: "2026-04-13T00:00:00.000Z"
---

## Current Focus
hypothesis: 确认根本原因是功能缺失，需要添加"完整报告导出"功能
test: 分析UAT期望与当前实现的差异
expecting: UAT明确期望一次导出包含所有数据
next_action: 返回诊断结果

## Symptoms
expected: 导出的Excel包含多sheet：汇总统计 + 详细记录。项目机时：预定数量、平均/最大/最小单次时长、详细记录sheet。设备使用率：预定次数、每日趋势sheet。使用记录：预定ID用于追溯。
actual: 导出的Excel只有使用记录，缺少项目机时、设备使用率数据
errors: 无错误信息
reproduction: 导出设备统计数据
started: UAT测试时发现

## Eliminated
- hypothesis: 前端传参错误导致type参数不正确
  evidence: 前端代码正确，getExportType()根据activeTab正确返回type参数
  timestamp: "2026-04-13T00:00:00.000Z"

## Evidence
- timestamp: "2026-04-13T00:00:00.000Z"
  checked: src/lib/equipment-stats.ts generateExcelBuffer函数
  found: |
    代码已实现三种导出类型：
    1. `project-hours`: 项目机时汇总 + 详细记录 (两个sheet) ✅
    2. `device-utilization`: 设备使用率汇总 + 每日趋势 (两个sheet) ✅
    3. `usage-record`: 使用记录 (一个sheet) ✅

    每种类型的导出逻辑是独立的，通过`type`参数区分。

- timestamp: "2026-04-13T00:00:00.000Z"
  checked: 导出API路由 src/app/api/v1/equipment/stats/export/route.ts
  found: API正确接收type参数并传递给generateExcelBuffer函数

- timestamp: "2026-04-13T00:00:00.000Z"
  checked: .planning/phases/09-shen-pei-e-yu-tong-ji/09-UAT.md UAT测试文档
  found: |
    UAT Test 9明确期望：
    "导出的Excel包含多sheet：汇总统计 + 详细记录。
    项目机时：预定数量、平均/最大/最小单次时长、详细记录sheet。
    设备使用率：预定次数、每日趋势sheet。
    使用记录：预定ID用于追溯。"

    这表明用户期望**一次导出**包含所有三种类型的数据，而不是按Tab分类导出。
    当前实现缺少"完整报告导出"功能。

## Resolution
root_cause: 当前导出功能设计为按Tab分类单独导出，每次只导出当前Tab对应类型的数据（project-hours/device-utilization/usage-record）。但UAT期望是一次导出包含所有三种类型数据的完整报告（项目机时汇总+详细记录、设备使用率汇总+每日趋势、使用记录）。缺少"完整报告导出"功能。
fix: 添加新的导出类型`complete-report`，一次性生成包含所有六sheet的Excel：项目机时汇总、项目机时详细记录、设备使用率汇总、设备使用率每日趋势、使用记录汇总、使用记录详细。同时在前端添加"导出完整报告"按钮。
verification:
files_changed: []