---
status: diagnosed
phase: 05-gantt
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-03-29T02:36:00Z
updated: 2026-03-29T02:45:00Z
---

## Current Test

number: 2
name: 依赖关系连线
expected: |
任务之间的依赖关系通过彩色连线展示，连线使用直角折线样式，末端有箭头指向被依赖任务
awaiting: user response

## Tests

### 1. 查看任务时间线

expected: 进入项目任务页面，切换到甘特图视图，可以看到任务按时间线排列，每个任务条显示任务名称、优先级颜色和进度百分比
result: issue
reported: "甘特图视图没有显示时间线"
severity: major

### 2. 依赖关系连线

expected: 任务之间的依赖关系通过彩色连线展示，连线使用直角折线样式，末端有箭头指向被依赖任务
result: [pending]

### 3. 缩放和平移浏览

expected: 可以通过工具栏切换日/周/月三种刻度，拖动滚动条平移时间线，点击"今天"按钮快速跳转到当前日期
result: [pending]

### 4. 关键路径高亮

expected: 关键路径上的任务条和依赖连线用橙红色高亮显示，与其他普通任务区分
result: [pending]

### 5. 悬停显示任务详情

expected: 鼠标悬停在任务条上上时，显示 Popover 弹窗，包含任务名称、状态、起止日期、进度百分比、负责人信息
result: [pending]

## Summary

total: 5
passed: 0
issues: 1
pending: 4
skipped: 0
blocked: 0

## Gaps

- truth: "甘特图视图显示任务时间线"
  status: failed
  reason: "User reported: 甘特图视图没有显示时间线"
  severity: major
  test: 1
  root_cause: "任务缺少 startDate 或 dueDate 时，getTaskPosition 返回 null，导致任务在 GanttTimeline 中被静默跳过，不渲染任何任务条。数据库 schema 中 startDate/dueDate 是 nullable 字段，从其他视图创建的任务可能没有日期。"
  artifacts:
  - path: "src/components/tasks/gantt/utils.ts"
    issue: "getTaskPosition 在任务缺少日期时返回 null，没有用户反馈"
    line: "70-72"
  - path: "src/components/tasks/gantt/GanttTimeline.tsx"
    issue: "静默跳过没有 position 的任务，不渲染"
    line: "150"
  - path: "src/components/tasks/gantt/TaskGantt.tsx"
    issue: "空状态判断不完整，没有检测'有任务但都没有日期'的情况"
    line: "145-152"
    missing:
  - "添加用户反馈：当任务没有日期时显示提示信息"
  - "改进空状态判断：检测'有任务但都没有日期'的情况"
  - "考虑在左面板显示无日期任务，提示用户需要设置日期"
    debug_session: ""
