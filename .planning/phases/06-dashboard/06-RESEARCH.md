# Phase 6: Dashboard (仪表盘) - Research

**Researched:** 2026-03-29
**Domain:** Recharts chart visualization components, dashboard API extensions
**Confidence:** HIGH

## Summary

This phase extends the existing dashboard with four new chart components: two donut charts (task status distribution, priority distribution), a project completion rate bar chart, and milestone progress bars. The implementation follows established patterns from ActivityChart (Recharts AreaChart) and MetricCard (animated numbers). APIs need extension to return distribution data and project completion rates.

**Primary recommendation:** Use Recharts PieChart with `innerRadius` for donut charts, BarChart with `layout="vertical"` for project comparison, and custom progress bar components for milestones. Extend existing stats/progress APIs rather than creating entirely new endpoints.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 任务状态分布和优先级分布使用环形图（Donut Chart）— 两个指标并排显示两个环形图，中间显示总数，现代感强
- **D-02:** 项目对比柱状图对比维度为「任务完成率」— 每个项目显示完成率百分比，最多展示 5-8 个项目
- **D-03:** 折线图采用双图组合 — 上方为任务完成趋势折线图（AreaChart），下方为任务状态分布环形图，形成"概览卡片"
- **D-04:** 保留现有 ActivityChart（Recharts AreaChart）作为基础，增强为任务完成趋势展示
- **D-05:** 里程碑进度使用进度条（Progress Bar）— 不使用燃尽图，每个里程碑一行显示标题 + 状态颜色 + 进度条 + 截止日期
- **D-06:** 里程碑进度展示用户参与的所有项目的活跃里程碑（默认全局视图），最多显示 5-6 个里程碑
- **D-07:** 点击里程碑可展开详情或跳转到项目里程碑页面
- **D-08:** 保留现有布局结构，新增图表区域 — 保留 WelcomeSection + StatsGrid + ActivityChart + TaskBoard + RiskOverview + QuickActions，在 StatsGrid 和 ActivityChart 之间插入新的图表区域
- **D-09:** 新增图表区域布局为 2x2 网格 — 左上: 任务状态分布环形图; 右上: 优先级分布环形图; 左下: 项目完成率对比柱状图; 右下: 里程碑进度条
- **D-10:** 图表卡片统一高度 280px，确保视觉对齐
- **D-11:** 仪表盘默认展示全局数据 — 所有项目的汇总统计
- **D-12:** 不添加项目筛选器 — 仪表盘始终为全局概览，如需查看单个项目数据，用户进入项目详情页
- **D-13:** Stats API 需扩展返回任务状态分布和优先级分布数据
- **D-14:** 新增 API 返回各项目任务完成率数据（用于柱状图对比）
- **D-15:** Progress API 扩展支持无 projectId 参数时返回全局里程碑进度列表

### Claude's Discretion

- 图表卡片的具体颜色主题和圆角样式
- 环形图中间数字的动画效果
- 空状态提示文案和图标
- 里程碑进度条的动画效果
- 柱状图的最大展示项目数量和排序方式

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                               | Research Support                                                                                         |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| DASH-01 | 统计卡片组件，展示任务数、完成率、风险数  | **Already implemented** — StatsGrid in MetricCard.tsx. Extension needed for distribution data per D-13.  |
| DASH-02 | 饼图/环形图组件，任务状态分布、优先级分布 | Recharts PieChart with `innerRadius` + `Label` for center text. See Standard Stack section.              |
| DASH-03 | 折线图组件，任务完成趋势、活动趋势        | **Already implemented** — ActivityChart.tsx (AreaChart). Enhancement per D-04 for task completion trend. |
| DASH-04 | 柱状图组件，项目对比、团队效率            | Recharts BarChart with `layout="vertical"` for horizontal bars. See Code Examples.                       |
| DASH-05 | 里程碑进度组件，燃进图/进度条             | Custom progress bar component (not Recharts). Per D-05, use progress bars, not burndown.                 |

</phase_requirements>

## Standard Stack

### Core (Charts)

| Library         | Version             | Purpose             | Why Standard                                             |
| --------------- | ------------------- | ------------------- | -------------------------------------------------------- |
| `recharts`      | 2.15.0 (installed)  | Chart visualization | Already installed, established patterns in ActivityChart |
| `framer-motion` | 12.38.0 (installed) | Animation effects   | Already installed, used in MetricCard stagger animations |

### Supporting (UI)

| Library                   | Version   | Purpose        | When to Use                                   |
| ------------------------- | --------- | -------------- | --------------------------------------------- |
| `lucide-react`            | 0.468.0   | Chart icons    | Chart header icons (PieChart, BarChart icons) |
| `tailwind-merge` + `clsx` | Installed | `cn()` utility | Progress bar styling, dynamic colors          |

### Alternatives Considered

| Instead of                   | Could Use         | Tradeoff                                                         |
| ---------------------------- | ----------------- | ---------------------------------------------------------------- |
| Recharts PieChart            | D3.js custom SVG  | Recharts declarative, already installed, simpler maintenance     |
| Custom progress bar          | Radix UI Progress | shadcn/ui has no progress component; custom gives more control   |
| Recharts BarChart horizontal | Chart.js          | Recharts React-native, easier integration with existing patterns |

**Installation:**
No new dependencies required. All libraries already installed.

**Version verification:**

```bash
npm view recharts version  # Latest: 3.8.1, Installed: 2.15.0
# Installed version 2.15.0 is stable, all features needed are available
```

## Architecture Patterns

### Recommended Project Structure

```
src/components/dashboard/
├── MetricCard.tsx           # EXISTING - StatsGrid
├── ActivityChart.tsx        # EXISTING - AreaChart (enhance for D-04)
├── TaskBoard.tsx            # EXISTING - keep unchanged
├── RiskOverview.tsx         # EXISTING - keep unchanged
├── WelcomeSection.tsx       # EXISTING - keep unchanged
├── QuickActions.tsx         # EXISTING - keep unchanged
├── ChartsGrid.tsx           # NEW - 2x2 grid container for new charts
├── TaskStatusDonut.tsx      # NEW - task status distribution donut
├── PriorityDonut.tsx        # NEW - priority distribution donut
├── ProjectComparisonChart.tsx # NEW - project completion rate bars
├── MilestoneProgressList.tsx  # NEW - milestone progress bars
└── ChartCard.tsx            # NEW (optional) - reusable chart card wrapper (280px height)
```

### Pattern 1: Recharts Donut Chart with Center Label

**What:** PieChart with `innerRadius` creates donut; `<Label>` component renders centered text.

**When to use:** DASH-02 task status and priority distribution charts.

**Example:**

```tsx
// Source: Context7 /recharts/recharts
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

function DonutChart({ data, title, total }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60} // Creates donut hole
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
          <Label value={total} position="center" fill="#333" fontSize={24} fontWeight="bold" />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Data structure for task status donut:
const taskStatusData = [
  { name: '待办', value: 12 },
  { name: '进行中', value: 8 },
  { name: '审核', value: 3 },
  { name: '测试', value: 2 },
  { name: '已完成', value: 15 },
  { name: '延期', value: 1 },
]
```

### Pattern 2: Recharts Horizontal Bar Chart

**What:** BarChart with `layout="vertical"` swaps X/Y axes for horizontal bars.

**When to use:** DASH-04 project comparison chart (D-02 specifies task completion rate per project).

**Example:**

```tsx
// Source: Context7 /recharts/recharts
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function ProjectComparisonChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis type="number" domain={[0, 100]} unit="%" />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="completionRate" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Data structure from API:
const projectData = [
  { name: '项目A', completionRate: 75 },
  { name: '项目B', completionRate: 60 },
  { name: '项目C', completionRate: 45 },
]
```

### Pattern 3: Custom Progress Bar Component

**What:** Tailwind-based progress bar with animated fill and status colors.

**When to use:** DASH-05 milestone progress list (D-05 specifies progress bars, not burndown).

**Example:**

```tsx
// Custom component following existing MetricCard patterns
import { motion } from 'framer-motion'

interface MilestoneProgressProps {
  title: string
  progress: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  dueDate?: Date | null
}

const statusColors = {
  NOT_STARTED: 'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
}

function MilestoneProgressItem({ title, progress, status, dueDate }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="relative mt-1 h-2 rounded-full bg-slate-100">
          <motion.div
            className={`absolute h-full rounded-full ${statusColors[status]}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      <span className="text-xs text-slate-500">{dueDate ? format(dueDate, 'MM/dd') : '-'}</span>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Avoid `fill` in data array:** Use `<Cell>` for per-slice colors instead of `data[].fill` — cleaner separation of data and styling
- **Avoid fixed-width ResponsiveContainer:** Always use `width="100%" height="100%"` with parent having explicit height (280px per D-10)
- **Avoid inline tooltip styles:** Use Tailwind classes via custom tooltip component or `contentStyle` object
- **Avoid creating new API routes for single endpoints:** Extend existing `/dashboard/stats` and `/dashboard/progress` per D-13, D-14, D-15

## Don't Hand-Roll

| Problem            | Don't Build             | Use Instead                                  | Why                                                         |
| ------------------ | ----------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| Chart animations   | Custom CSS animations   | Recharts built-in `isAnimationActive`        | Recharts handles enter/update/exit animations automatically |
| Responsive charts  | Window resize listeners | `ResponsiveContainer`                        | Uses ResizeObserver, handles all breakpoints                |
| Tooltip formatting | Custom DOM manipulation | `<Tooltip formatter={...}>`                  | Recharts manages tooltip positioning, accessibility         |
| Number animations  | Custom JS counters      | `AnimatedNumber` pattern from MetricCard.tsx | Already implemented, proven pattern                         |

**Key insight:** Recharts handles SVG rendering, transitions, and interactivity. Focus on data transformation and styling, not chart mechanics.

## Common Pitfalls

### Pitfall 1: ResponsiveContainer Requires Parent Height

**What goes wrong:** Charts don't render or show 0 height when parent lacks explicit height.

**Why it happens:** `ResponsiveContainer` calculates dimensions from parent; without explicit height, it defaults to 0.

**How to avoid:** Set parent div to fixed height (280px per D-10) before ResponsiveContainer.

**Warning signs:** Chart area empty, console warning "ResponsiveContainer width/height is 0".

```tsx
// WRONG
<ResponsiveContainer width="100%" height="100%">
  <PieChart>...</PieChart>
</ResponsiveContainer>

// CORRECT (per D-10)
<div className="h-[280px]">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>...</PieChart>
  </ResponsiveContainer>
</div>
```

### Pitfall 2: PieChart Cell Colors Index Mismatch

**What goes wrong:** Slice colors don't match expected status/priority colors after data reorder.

**Why it happens:** `Cell` uses array index for color selection; if data changes order, colors shift.

**How to avoid:** Use consistent color map based on `name` value, not index.

```tsx
// WRONG - index-based colors
{
  data.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)
}

// CORRECT - value-based colors
const STATUS_COLORS = {
  TODO: '#3b82f6',
  IN_PROGRESS: '#10b981',
  DONE: '#22c55e',
  BLOCKED: '#ef4444',
}
{
  data.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)
}
```

### Pitfall 3: SSR Hydration with Framer Motion

**What goes wrong:** Animation components cause hydration mismatch errors in Next.js SSR.

**Why it happens:** Framer Motion animations may have different initial states on server vs client.

**How to avoid:** Follow pattern from MetricCard.tsx — use `initial/animate` variants, not dynamic initial values. Use `motion.div` for container animations, not inline style changes.

**Warning signs:** Console error "Text content does not match server-rendered HTML".

### Pitfall 4: Empty Data State

**What goes wrong:** Charts show nothing when user has no tasks/projects, confusing users.

**Why it happens:** API returns empty array; Recharts renders blank SVG.

**How to avoid:** Add empty state check before chart, show placeholder message (Claude's Discretion item).

```tsx
// Pattern from ActivityChart.tsx
{
  loading ? (
    <div className="flex h-[280px] items-center justify-center">加载中...</div>
  ) : data.length === 0 ? (
    <div className="text-muted-foreground flex h-[280px] items-center justify-center">暂无数据</div>
  ) : (
    <ResponsiveContainer>
      <PieChart>...</PieChart>
    </ResponsiveContainer>
  )
}
```

## Code Examples

Verified patterns from official sources:

### Task Status Donut Chart (Complete)

```tsx
// Source: Context7 + ActivityChart.tsx patterns
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { PieChartIcon } from 'lucide-react'

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: '#3b82f6',
  IN_PROGRESS: '#10b981',
  REVIEW: '#8b5cf6',
  TESTING: '#f59e0b',
  DONE: '#22c55e',
  CANCELLED: '#6b7280',
  DELAYED: '#ef4444',
  BLOCKED: '#dc2626',
}

interface TaskStatusData {
  name: string
  value: number
}

export function TaskStatusDonut() {
  const [data, setData] = useState<TaskStatusData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/stats', { credentials: 'include' })
        const result = await response.json()
        if (result.success && result.data.taskStatusDistribution) {
          setData(result.data.taskStatusDistribution)
        }
      } catch (e) {
        console.error('获取任务状态分布失败:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStatusData()
  }, [])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="h-[280px] shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <PieChartIcon className="h-5 w-5 text-blue-500" />
          任务状态分布
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">
            加载中...
          </div>
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">
            暂无任务数据
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={TASK_STATUS_COLORS[entry.name] || '#6b7280'} />
                  ))}
                  <Label
                    value={total}
                    position="center"
                    fill="#333"
                    fontSize={20}
                    fontWeight="bold"
                  />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Project Comparison Bar Chart (Complete)

```tsx
// Source: Context7 + ActivityChart.tsx patterns
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3 } from 'lucide-react'

interface ProjectData {
  name: string
  completionRate: number
  projectId: string
}

export function ProjectComparisonChart() {
  const [data, setData] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/project-comparison', {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success) {
          // Limit to 5-8 projects per D-02
          setData(result.data.slice(0, 6))
        }
      } catch (e) {
        console.error('获取项目对比数据失败:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchProjectData()
  }, [])

  return (
    <Card className="h-[280px] shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <BarChart3 className="h-5 w-5 text-emerald-500" />
          项目完成率对比
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">
            加载中...
          </div>
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">
            暂无项目数据
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="completionRate" fill="#10b981" barSize={16} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## State of the Art

| Old Approach          | Current Approach         | When Changed                  | Impact                                   |
| --------------------- | ------------------------ | ----------------------------- | ---------------------------------------- |
| Global CSS animations | Framer Motion components | Phase 01-ui                   | Declarative animations, easier debugging |
| Fixed-width charts    | ResponsiveContainer      | ActivityChart.tsx             | Auto-responsive without resize listeners |
| Single API endpoint   | Extended dashboard stats | This phase (D-13, D-14, D-15) | Consolidated data fetch                  |

**Deprecated/outdated:**

- D3.js manual SVG: Recharts provides React-native declarative API
- CSS-only progress bar animations: Framer Motion gives better control

## Open Questions

1. **Should ChartCard be a shared component?**
   - What we know: All charts need Card wrapper with 280px height, similar header pattern
   - What's unclear: Whether to create reusable ChartCard or duplicate Card wrapper in each component
   - Recommendation: Create shared ChartCard component to ensure uniform styling (280px height per D-10)

2. **ActivityChart enhancement scope?**
   - What we know: D-04 says "enhance for task completion trend"
   - What's unclear: Whether to modify existing AreaChart or create separate component
   - Recommendation: Modify existing ActivityChart.tsx — add toggle between "activity" and "completion" modes, or replace data source to show task completion dates instead of activity counts

## Environment Availability

| Dependency    | Required By            | Available | Version                                       | Fallback |
| ------------- | ---------------------- | --------- | --------------------------------------------- | -------- |
| Node.js       | Runtime                | ✓         | 22.22.1                                       | —        |
| PostgreSQL    | Dashboard data queries | ✓         | Docker container `project_manager_postgres_1` | —        |
| npm           | Package management     | ✓         | 10.9.4                                        | —        |
| Recharts      | Chart rendering        | ✓         | 2.15.0 (installed)                            | —        |
| Framer Motion | Animations             | ✓         | 12.38.0 (installed)                           | —        |

**Missing dependencies with no fallback:**
None — all required dependencies verified available.

**Missing dependencies with fallback:**
None.

## Validation Architecture

### Test Framework

| Property           | Value                        |
| ------------------ | ---------------------------- |
| Framework          | Vitest 3.2.4                 |
| Config file        | `vitest.config.ts`           |
| Quick run command  | `npm run test:unit`          |
| Full suite command | `npm run test:unit:coverage` |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                          | Test Type              | Automated Command                                                                 | File Exists? |
| -------- | ----------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------- | ------------ |
| DASH-01  | Stats cards display values from API                               | unit (existing)        | `npm run test:unit -- tests/integration/database/dashboard.integration.test.ts`   | ✅           |
| DASH-02  | Task status donut renders with correct slice colors               | unit                   | `npm run test:unit -- tests/components/dashboard/TaskStatusDonut.test.tsx`        | ❌ Wave 0    |
| DASH-02  | Priority donut renders with correct slice colors                  | unit                   | `npm run test:unit -- tests/components/dashboard/PriorityDonut.test.tsx`          | ❌ Wave 0    |
| DASH-03  | ActivityChart shows task completion trend                         | unit (modify existing) | `npm run test:unit -- tests/components/dashboard/ActivityChart.test.tsx`          | ❌ Wave 0    |
| DASH-04  | Project comparison bar chart renders horizontal bars              | unit                   | `npm run test:unit -- tests/components/dashboard/ProjectComparisonChart.test.tsx` | ❌ Wave 0    |
| DASH-05  | Milestone progress list shows items with progress bars            | unit                   | `npm run test:unit -- tests/components/dashboard/MilestoneProgressList.test.tsx`  | ❌ Wave 0    |
| DASH-API | Stats API returns taskStatusDistribution and priorityDistribution | integration            | `npm run test:unit -- tests/integration/database/dashboard.integration.test.ts`   | ✅ (extend)  |
| DASH-API | Progress API returns global milestones when no projectId          | integration            | `npm run test:unit -- tests/integration/database/dashboard.integration.test.ts`   | ✅ (extend)  |

### Sampling Rate

- **Per task commit:** `npm run test:unit -- tests/components/dashboard/*.test.tsx`
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** `npm run test:unit:coverage` — coverage thresholds: 90% statements, 85% branches

### Wave 0 Gaps

- [ ] `tests/components/dashboard/TaskStatusDonut.test.tsx` — test task status donut rendering
- [ ] `tests/components/dashboard/PriorityDonut.test.tsx` — test priority donut rendering
- [ ] `tests/components/dashboard/ProjectComparisonChart.test.tsx` — test project comparison bars
- [ ] `tests/components/dashboard/MilestoneProgressList.test.tsx` — test milestone progress items
- [ ] `tests/components/dashboard/ActivityChart.test.tsx` — test ActivityChart (enhanced mode)
- [ ] `tests/components/dashboard/ChartCard.test.tsx` — test shared chart card wrapper (if created)

**Existing test infrastructure:**

- `tests/integration/database/dashboard.integration.test.ts` — exists, needs extension for new API endpoints
- `vitest.config.ts` — configured with jsdom, coverage thresholds
- `tests/helpers/test-db.ts` — test database setup
- `tests/helpers/test-data-factory.ts` — test user/project/task factories

## Sources

### Primary (HIGH confidence)

- `/recharts/recharts` (Context7) - PieChart, BarChart, ResponsiveContainer, Cell, Label patterns
- `src/components/dashboard/ActivityChart.tsx` - Established Recharts patterns (AreaChart, gradient fills, Tooltip styling)
- `src/components/dashboard/MetricCard.tsx` - AnimatedNumber pattern, StatsGrid structure, fetch pattern
- `src/app/api/v1/dashboard/stats/route.ts` - Existing API pattern (Prisma queries, response helpers)
- `prisma/schema.prisma` - TaskStatus enum (TODO, IN_PROGRESS, REVIEW, TESTING, DONE, CANCELLED, DELAYED, BLOCKED), TaskPriority enum (LOW, MEDIUM, HIGH, CRITICAL), MilestoneStatus enum

### Secondary (MEDIUM confidence)

- `src/lib/api/response.ts` - `success()` and `error()` helpers
- `src/lib/animations.ts` - staggerContainer, staggerItem variants
- `src/components/ui/card.tsx` - Card, CardHeader, CardTitle, CardContent pattern
- `src/components/ui/skeleton.tsx` - SkeletonMetric pattern for loading states

### Tertiary (LOW confidence)

None — all findings verified from installed code or official Context7 docs.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Recharts already installed, patterns verified from ActivityChart.tsx
- Architecture: HIGH - Component structure follows existing dashboard patterns, D-01 to D-15 locked
- Pitfalls: HIGH - Based on official Context7 docs and existing code patterns

**Research date:** 2026-03-29
**Valid until:** 30 days (stable libraries, no breaking changes expected)

---

_Phase: 06-dashboard_
_Researched: 2026-03-29_
