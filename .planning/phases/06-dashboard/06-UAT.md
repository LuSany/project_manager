---
status: diagnosed
phase: 06-dashboard
source:
  - 06-00-SUMMARY.md
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
  - 06-03-SUMMARY.md
  - 06-04-SUMMARY.md
started: 2026-03-29T00:00:00.000Z
updated: 2026-04-02T13:00:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Dashboard Charts Grid Display

expected: Navigate to /dashboard. Between StatsGrid and ActivityChart, a 2x2 grid of chart cards should appear. Each card should render with 280px height.
result: issue
reported: "dashboard展示的任务状态、优先级分布饼状图，缺少具体占比数据显示"
severity: major

### 2. Task Status Donut Chart

expected: Donut chart showing task status distribution with colored slices. Center should display total task count. Tooltip on hover shows status name and count. Color mapping: TODO=blue, IN_PROGRESS=emerald, REVIEW=violet, TESTING=amber, DONE=green.
result: issue
reported: "dashboard展示的任务状态、优先级分布饼状图，缺少具体占比数据显示"
severity: major

### 3. Priority Donut Chart

expected: Donut chart showing priority distribution (LOW/MEDIUM/HIGH/CRITICAL) with colored slices. Center displays total count. Tooltip shows priority labels in Chinese.
result: issue
reported: "dashboard展示的任务状态、优先级分布饼状图，缺少具体占比数据显示"
severity: major

### 4. Project Completion Bar Chart

expected: Horizontal bar chart showing project completion rates. Shows up to 6 projects sorted by completion rate. X-axis shows percentage (0-100%). Tooltip shows completion rate.
result: pending

### 5. Milestone Progress List

expected: List of active milestones (max 6) with progress bars. Each item shows: status dot (colored by status), milestone title, project name, progress bar with percentage, due date in MM/dd format. Progress bars animate on load.
result: issue
reported: "dashboard缺少里程碑进度数据"
severity: major

### 6. Charts Responsive Layout

expected: On mobile (viewport < 768px), charts stack in single column. On medium+ screens, 2-column grid.
result: issue
reported: "web页面无法滑动查看所有页面数据"
severity: major

### 7. Charts Loading State

expected: Before data loads, each chart shows skeleton/loading indicator. After data arrives, chart renders.
result: pending

### 8. Charts Empty State

expected: When no data available, each chart shows "暂无数据" (or appropriate empty message).
result: pending

### 9. My Tasks Badge

expected: "我的任务" badge shows accurate count of assigned tasks.
result: issue
reported: "dashboard我的任务永远显示有红色数字5"
severity: major

### 10. Notification Badge

expected: Notification badge shows accurate count of unread notifications. Clicking shows notification list.
result: issue
reported: "dashboard通知按钮永远有小红点，点击查看，没有任何通知消息"
severity: major

## Summary

total: 10
passed: 0
issues: 7
pending: 3
skipped: 0

## Gaps

- truth: "Task Status and Priority donut charts show specific percentage/ratio data"
  status: failed
  reason: "User reported: dashboard展示的任务状态、优先级分布饼状图，缺少具体占比数据显示"
  severity: major
  test: 1
  root_cause: "Legend items in TaskStatusDonut.tsx (lines 97-110) and PriorityDonut.tsx (lines 92-107) only display label names with color dots, but do NOT show percentage or count values. The Label component only shows total in center, but legend lacks per-item percentages."
  artifacts:
  - path: "src/components/dashboard/TaskStatusDonut.tsx"
    issue: "Legend (lines 97-110) missing percentage display"
  - path: "src/components/dashboard/PriorityDonut.tsx"
    issue: "Legend (lines 92-107) missing percentage display"
    missing:
  - "Add percentage calculation: `${(item.value / total * 100).toFixed(1)}%`"
  - "Update legend to show: `{label} ({percentage}%)` or `{label}: {count}`"
    debug_session: ""

- truth: "Milestone Progress List shows active milestone data"
  status: failed
  reason: "User reported: dashboard缺少里程碑进度数据"
  severity: major
  test: 5
  root_cause: "API /api/v1/dashboard/progress returns empty milestones list when: (1) user has no projects (projectIds.length === 0), or (2) no milestones exist with NOT_STARTED/IN_PROGRESS status. Need to verify database has milestones with active statuses."
  artifacts:
  - path: "src/app/api/v1/dashboard/progress/route.ts"
    issue: "Query filters only NOT_STARTED and IN_PROGRESS statuses (line 49)"
  - path: "src/components/dashboard/MilestoneProgressList.tsx"
    issue: "Correctly handles empty data with emptyMessage"
    missing:
  - "Check if milestones table has data with active statuses"
  - "Consider showing all milestones (not just active) or adding fallback sample data"
    debug_session: ""

- truth: "Web page is scrollable to view all dashboard content"
  status: failed
  reason: "User reported: web页面无法滑动查看所有页面数据"
  severity: major
  test: 6
  root_cause: "AppLayout.tsx uses h-screen for outer container (line 45), but the main content area wrapper has overflow-hidden (line 52). While main has overflow-y-auto (line 61), there may be CSS conflict with margin-left classes (ml-16/ml-64 on line 54) that interfere with layout calculation."
  artifacts:
  - path: "src/components/layout/AppLayout.tsx"
    issue: "Potential CSS conflict between overflow-hidden container and overflow-y-auto main"
  - path: "src/components/dashboard/ChartCard.tsx"
    issue: "Fixed height h-[280px] may contribute to overflow issues"
    missing:
  - "Verify overflow-y-auto works correctly on main element"
  - "Check if sidebar positioning (absolute/fixed) affects main content area width"
  - "Test removing overflow-hidden from container or adjusting margin classes"
    debug_session: ""

- truth: "My Tasks badge shows accurate count of assigned tasks"
  status: failed
  reason: "User reported: dashboard我的任务永远显示有红色数字5"
  severity: major
  test: 9
  root_cause: "Sidebar.tsx line 42 has hardcoded `badge: 5` in navItems array. Badge count is static, never fetched from API or updated dynamically."
  artifacts:
  - path: "src/components/layout/Sidebar.tsx"
    issue: "Hardcoded badge value (line 42): `badge: 5`"
    missing:
  - "Remove hardcoded badge: 5 from navItems"
  - "Fetch actual task count from API (e.g., /api/v1/dashboard/my-tasks)"
  - "Update badge dynamically based on user's assigned task count"
    debug_session: ""

- truth: "Notification badge shows accurate unread count and clicking shows notifications"
  status: failed
  reason: "User reported: dashboard通知按钮永远有小红点，点击查看，没有任何通知消息"
  severity: major
  test: 10
  root_cause: "Header.tsx line 105 has a static red dot badge that's always rendered. No API call to fetch unread notification count, and no conditional rendering based on actual notifications."
  artifacts:
  - path: "src/components/layout/Header.tsx"
    issue: "Static badge (line 105): `<span className=\"bg-destructive ...\"></span>` always visible"
    missing:
  - "Create /api/v1/notifications/unread-count endpoint or use existing notifications API"
  - "Fetch unread count and conditionally render badge"
  - "Verify notifications page /notifications exists and shows notification list"
    debug_session: ""
