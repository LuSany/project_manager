---
phase: 06-dashboard
plan: 02
subsystem: ui
tags: [recharts, pie-chart, donut-chart, react, vitest, tdd]

requires:
  - phase: 06-dashboard/plan-00
    provides: ChartCard wrapper, dashboard-charts types and color maps
  - phase: 06-dashboard/plan-01
    provides: ActivityChart Recharts pattern reference

provides:
  - TaskStatusDonut component with value-based TASK_STATUS_COLORS
  - PriorityDonut component with value-based PRIORITY_COLORS
  - TDD test suites for both donut components (11 tests total)

affects: [06-dashboard, dashboard-ui, chart-components]

tech-stack:
  added: []
  patterns: [donut-chart-pattern, value-based-color-mapping, recharts-pie-label]

key-files:
  created:
    - src/components/dashboard/TaskStatusDonut.tsx
    - src/components/dashboard/PriorityDonut.tsx
  modified:
    - src/components/dashboard/ChartCard.tsx
    - tests/components/dashboard/TaskStatusDonut.test.tsx
    - tests/components/dashboard/PriorityDonut.test.tsx

key-decisions:
  - 'Use local DistributionItem interface {name, value} matching API response format instead of typed Prisma interfaces'
  - 'Fix ChartCard missing React import needed for vitest/jsdom rendering'
  - 'Use cleanup() in beforeEach to prevent DOM element leakage between tests'

patterns-established:
  - 'Donut chart pattern: ChartCard wrapper + ResponsiveContainer + PieChart with innerRadius/outerRadius + Cell for value-based colors + Label for center total'
  - 'Test pattern: Mock Recharts components with data-testid attributes, verify color mapping via Cell fill attribute'

requirements-completed: [DASH-02]

duration: 16min
completed: 2026-03-29
---

# Phase 06 Plan 02: Donut Charts Summary

**TaskStatusDonut 和 PriorityDonut 甜甜圈图组件，使用 Recharts PieChart 实现基于值的颜色映射、中心总数标签和中文图例**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-29T23:20:58Z
- **Completed:** 2026-03-29T23:36:32Z
- **Tasks:** 2 (TDD: RED → GREEN for each)
- **Files modified:** 5

## Accomplishments

- TaskStatusDonut 甜甜圈图：8种任务状态颜色映射，中心总数，中文状态标签图例
- PriorityDonut 甜甜圈图：4种优先级颜色映射，中心总数，中文优先级标签图例
- 11个 TDD 测试全部通过，覆盖渲染、颜色映射、空状态、加载状态、API 请求

## Task Commits

1. **Task 1 RED: TaskStatusDonut 测试** - `7c8aaae` (test)
2. **Task 1 GREEN: TaskStatusDonut 组件** - `dca9b86` (feat)
3. **Task 2 RED: PriorityDonut 测试** - `b0e3287` (test)
4. **Task 2 GREEN: PriorityDonut 组件** - `1e167ce` (feat)

## Files Created/Modified

- `src/components/dashboard/TaskStatusDonut.tsx` - 任务状态分布甜甜圈图组件
- `src/components/dashboard/PriorityDonut.tsx` - 优先级分布甜甜圈图组件
- `src/components/dashboard/ChartCard.tsx` - 添加 React 导入修复 vitest 兼容性
- `tests/components/dashboard/TaskStatusDonut.test.tsx` - 6个测试用例
- `tests/components/dashboard/PriorityDonut.test.tsx` - 5个测试用例

## Decisions Made

- 使用本地 `DistributionItem {name, value}` 接口匹配 API 响应格式，而非 Prisma 类型接口（API 返回 name/value 而非 status/count）
- 修复 ChartCard 缺少 React 导入的问题，vitest jsdom 环境需要显式 React 导入
- 测试中使用 cleanup() 防止 DOM 元素跨测试泄漏

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 修复 ChartCard 缺少 React 导入**

- **Found during:** Task 1 (TaskStatusDonut 组件测试)
- **Issue:** ChartCard.tsx 使用 JSX 但未导入 React，导致 vitest jsdom 环境渲染失败
- **Fix:** 添加 `import * as React from 'react'`
- **Files modified:** src/components/dashboard/ChartCard.tsx
- **Verification:** 测试通过
- **Committed in:** dca9b86 (Task 1 GREEN commit)

**2. [Rule 1 - Bug] 修正组件使用错误的类型导入和不存在的导出**

- **Found during:** Task 1 & 2 (组件实现)
- **Issue:** 预存组件使用 `TaskStatusDistributionItem`（含 status/count/color 字段）和 `EMPTY_STATE_MESSAGES`（不存在），但 API 返回 {name, value} 格式
- **Fix:** 改用本地 `DistributionItem {name, value}` 接口，使用 `EMPTY_TASK_MESSAGE` 常量
- **Files modified:** TaskStatusDonut.tsx, PriorityDonut.tsx
- **Verification:** 所有测试通过

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** 修正预存代码中的类型错误，确保组件与实际 API 响应格式一致。无范围蔓延。

## Issues Encountered

- 测试 loading state 时 React strict mode 导致 DOM 元素重复，通过改用 `queryAllByTestId` + length 断言解决

## User Setup Required

None - 无需外部配置。

## Next Phase Readiness

- 两个甜甜圈图组件完成，可直接用于 dashboard 页面集成
- 图例渲染在 ChartCard 200px 高度区域内，布局已验证

---

_Phase: 06-dashboard_
_Completed: 2026-03-29_
