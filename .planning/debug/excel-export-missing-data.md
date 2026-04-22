---
status: resolved
trigger: "导出的Excel只有使用记录，缺少项目机时、设备使用率数据"
created: 2026-04-13T00:00:00.000Z
updated: 2026-04-22T00:00:00.000Z
---

## Resolution

root_cause: 当前导出功能设计为按Tab分类单独导出，每次只导出当前Tab对应类型的数据。但UAT期望是一次导出包含所有三种类型数据的完整报告。

fix: 
  1. 后端 equipment-stats.ts 已有 complete-report 类型（第392-488行）
     - 生成3个sheet：项目机时汇总、设备使用率汇总、详细使用记录
  
  2. 前端 ExcelExportButton.tsx 添加 complete-report 类型支持
  
  3. equipment/stats/page.tsx 添加"导出完整报告"按钮

verification: npm run build成功
files_changed: [
  src/lib/equipment-stats.ts,
  src/components/equipment/ExcelExportButton.tsx,
  src/app/(main)/equipment/stats/page.tsx
]

## Status

✅ 已修复 - 前端添加"导出完整报告"按钮，后端已有 complete-report 类型