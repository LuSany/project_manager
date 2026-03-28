---
phase: 05-gantt
plan: 02
subsystem: ui
tags: [react, typescript, svg, zustand, tanstack-query, critical-path]

# Dependency graph
requires:
  - phase: 05-gantt
    provides: gantt basic framework from plan 01
provides:
  - Dependency visualization with orthogonal SVG paths
  - Critical path algorithm and highlighting
  - Hover tooltips for dependency details
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [SVG path rendering, critical path algorithm (longest path), topological sort + DP]

key-files:
  created:
    [
      src/components/tasks/gantt/GanttDependencyLine.tsx,
      src/components/tasks/gantt/GanttDependencyTooltip.tsx,
      src/components/tasks/gantt/GanttCriticalPath.ts,
    ]
  modified:
    [
      src/components/tasks/gantt/GanttTimeline.tsx,
      src/components/tasks/gantt/index.ts,
      src/components/tasks/gantt/__tests__/GanttDependencyLine.test.tsx,
      src/components/tasks/gantt/__tests__/GanttCriticalPath.test.ts,
    ]

key-decisions:
  - 'FS dependency: path from source right edge to target left edge'
  - 'SS dependency: path from source left edge to target left edge'
  - 'FF dependency: path from source right edge to target right edge'
  - 'SF dependency: path from source left edge to target right edge'

patterns-established:
  - 'Orthogonal path algorithm: M startX startY → L midX1 startY → L midX1 midY → ...'
  - 'Critical path: topological sort + DP for longest path in DAG'
  - 'Dependency color coding: FS=blue, SS=green, FF=purple, SF=orange'

requirements-completed: [TASK-04]

# Metrics
duration: ~16min
completed: 2026-03-29T02:00:00Z
---

# Phase 05: Plan 02 - Dependency Visualization & Critical Path Summary

**SVG dependency lines with orthogonal paths + critical path algorithm for task highlighting**

## Performance

- **Duration:** ~16 min
- **Tasks:** 2 (both completed with TDD)
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- **GanttDependencyLine**: SVG component rendering orthogonal dependency lines with:
  - Color coding by dependency type (FS=blue, SS=green, FF=purple, SF=orange)
  - Solid triangle arrow at endpoint
  - Critical path highlighting (orange border)
  - Hover effects (increased stroke width + opacity)

- **GanttDependencyTooltip**: Popover component showing on hover:
  - Source task name → target task name
  - Dependency type with color-coded badge
  - Dependency status (completed/incomplete)

- **GanttCriticalPath**: Critical path algorithm using:
  - Topological sort to find task dependencies
  - Dynamic programming to calculate earliest start/finish times
  - Backtracking to find longest path (critical path)
  - Edge cases: empty dependencies, single task, diamond dependencies

- **GanttTimeline integration**: Updated to:
  - Calculate task positions via getTaskPosition
  - Render dependency lines between tasks
  - Calculate and pass isCritical to task bars and lines
  - Show tooltip on line hover

## Task Commits

Each task was committed atomically:

1. **Test scaffold** - `65facb9` (test)
2. **Implementation** - `e88bfee` (feat)

## Files Created/Modified

- `src/components/tasks/gantt/GanttDependencyLine.tsx` - SVG orthogonal path rendering
- `src/components/tasks/gantt/GanttDependencyTooltip.tsx` - Hover tooltip for dependencies
- `src/components/tasks/gantt/GanttCriticalPath.ts` - Critical path algorithm (longest path)
- `src/components/tasks/gantt/GanttTimeline.tsx` - Updated with dependency line rendering
- `src/components/tasks/gantt/index.ts` - Added new exports
- `src/components/tasks/gantt/__tests__/GanttDependencyLine.test.tsx` - 6 tests
- `src/components/tasks/gantt/__tests__/GanttCriticalPath.test.ts` - 5 tests

## Decisions Made

- Used orthogonal path algorithm that goes upward (negative Y) when target is to the right of source
- Arrow direction determined by dependency type (left for FS/SS, right for FF/SF)
- Critical path uses orange color (#f97316) matching the UI spec
- Tooltip positioned at midpoint between source and target

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Test failure for critical path color due to querySelector path issue - fixed by using `svg > g > path`
- Duplicate interface definition in GanttTimeline - removed duplicate

## User Setup Required

None - no external service configuration required.

---

_Phase: 05-gantt_
_Completed: 2026-03-29_

## Self-Check: PASSED

**Files created:** All verified present

- src/components/tasks/gantt/GanttDependencyLine.tsx ✓
- src/components/tasks/gantt/GanttDependencyTooltip.tsx ✓
- src/components/tasks/gantt/GanttCriticalPath.ts ✓
- src/components/tasks/gantt/GanttTimeline.tsx ✓
- src/components/tasks/gantt/index.ts ✓

**Commits:** Verified present

- 65facb9: test(05-02): add failing test scaffold for dependency line and critical path ✓
- e88bfee: feat(05-02): implement dependency visualization and critical path ✓

**Tests:** All 11 tests pass (5 critical path + 6 dependency line)
