---
status: diagnosed
phase: 05-gantt
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-03-29T03:00:00Z
updated: 2026-03-29T03:10:00Z
---

## Current Test

[testing complete]

## Tests

### 6. 点击打开任务详情

expected: 点击任务条打开任务详情抽屉，可以查看和编辑任务的完整信息
result: issue
reported: "编辑任务详情后没有保存按钮,需要设置为自动保存,且可以自动同步到其他视图"
severity: major
test: 6
root_cause: ""
artifacts: []
missing: []
debug_session: ""

### 7. 视图切换

expected: 任务页面顶部视图切换按钮包含"甘特图"选项，点击可以切换到甘特图视图模式
result: pass

## Summary

total: 7
passed: 2
issues: 3
pending: 0
skipped: 0
blocked: 2

## Gaps

- truth: "今天日期在时间线上有高亮显示"
  status: failed
  reason: "User reported: 今天日期没有高亮"
  severity: minor
  test: 3
  root_cause: "timeRange.start.setHours() 原地修改了 Date 对象，导致今天指示线位置计算错误。setHours() 返回时间戳的同时会修改原对象，后续计算使用了错误的时间基准。"
  artifacts:
  - path: "src/components/tasks/gantt/GanttTimeline.tsx"
    issue: "timeRange.start.setHours(0,0,0,0) 修改原始对象"
    line: "70"
    missing:
  - "使用 new Date(timeRange.start) 创建副本后再调用 setHours()"
  - "或使用 date-fns 的 differenceInDays 函数"
    debug_session: ""

- truth: "鼠标悬停任务条时显示Popover弹窗"
  status: failed
  reason: "User reported: 鼠标悬停,没有显示popover弹窗"
  severity: major
  test: 5
  root_cause: "GanttTimeline 完全缺少任务悬停状态管理和 GanttTaskPopover 集成。GanttTaskBar 没有 hover 事件处理器，GanttTimeline 不渲染 GanttTaskPopover。"
  artifacts:
  - path: "src/components/tasks/gantt/GanttTimeline.tsx"
    issue: "缺少 hoveredTaskId state，缺少 GanttTaskPopover 导入和渲染"
    line: "38-39, 155-163"
  - path: "src/components/tasks/gantt/GanttTaskBar.tsx"
    issue: "Props 缺少 onHover 定义，SVG 元素缺少鼠标事件处理器"
    line: "11-15, 17-79"
    missing:
  - "GanttTimeline 添加 hoveredTaskId state"
  - "GanttTaskBar 添加 onMouseEnter/onMouseLeave 事件"
  - "GanttTimeline 渲染 GanttTaskPopover 组件"
    debug_session: ""

- truth: "编辑任务详情支持自动保存并同步到其他视图"
  status: failed
  reason: "User reported: 编辑任务详情后没有保存按钮,需要设置为自动保存,且可以自动同步到其他视图"
  severity: major
  test: 6
  root_cause: "DetailTab 组件中标题和描述字段使用传统编辑模式（需手动保存），而其他字段（状态、优先级等）使用实时自动保存，体验不一致。updateMutation 已正确配置 invalidateQueries，同步机制无问题。"
  artifacts:
  - path: "src/components/tasks/detail/DetailTab.tsx"
    issue: "标题需要手动调用 handleTitleSave()"
    line: "176-181"
  - path: "src/components/tasks/detail/DetailTab.tsx"
    issue: "描述需要手动调用 handleDescSave()"
    line: "183-188"
  - path: "src/components/tasks/detail/DetailTab.tsx"
    issue: "其他字段通过 handleUpdate 实现实时保存"
    line: "157-159"
    missing:
  - "标题和描述添加 debounced auto-save（500-800ms 延迟后自动保存）"
  - "移除手动保存按钮或改为立即保存"
  - "添加保存状态视觉反馈"
    debug_session: ""
