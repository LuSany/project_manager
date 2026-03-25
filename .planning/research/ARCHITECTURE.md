# 架构模式

**领域:** 现代化项目管理 UI
**研究日期:** 2026-03-25

## 推荐架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Layout Hierarchy (Server)               │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │    │
│  │  │  Auth   │  │  Main   │  │  Project │  ...        │    │
│  │  │ Layout  │  │ Layout  │  │ Layout  │             │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘              │    │
│  │       │            │            │                    │    │
│  │       └────────────┴────────────┘                    │    │
│  │                    ↓                                  │    │
│  │              Page Components (Server)                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Client Component Boundary                  │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Feature Hooks  │  │  Zustand Store  │                   │
│  │  (useAuth, etc) │  │  (board, ui)    │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └──────────┬─────────┘                             │
│                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Smart Components (Container)                ││
│  │  TaskList, KanbanBoard, RiskMatrix, Dashboard           ││
│  └────────────────────────┬────────────────────────────────┘│
│                           │                                   │
│                           ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Dumb Components (Presentational)            ││
│  │  Card, Column, Button, Dialog, TaskItem, RiskCard       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    UI Foundation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Radix UI    │  │  Tailwind    │  │  CSS Variables  │   │
│  │  Primitives  │  │  Utilities   │  │  (Theming)      │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 组件边界

| 组件层级 | 职责 | 通信对象 | 示例 |
|----------|------|----------|------|
| **Layout 层** (Server) | 应用外壳、路由结构、SEO | 无 (只接收 params) | `src/app/(main)/layout.tsx` |
| **Page 层** (Server) | 数据获取、权限检查、初始状态 | API Client → Store | `src/app/projects/[id]/page.tsx` |
| **Feature 层** (Client) | 业务逻辑封装、状态订阅 | Store + Hooks + API | `TaskList`, `KanbanBoard`, `RiskMatrix` |
| **Smart Component** (Client) | 组合 Dumb 组件、处理交互 | Feature Hooks | `TaskKanban`, `Dashboard` |
| **Dumb Component** (Client) | 纯展示、事件回调 | Props + Callbacks | `TaskCard`, `RiskCard`, `Column` |
| **UI Primitive** (Client) | 无状态基础组件 | Props only | `Button`, `Dialog`, `Card` |

### 数据流

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│   API       │
│   (User)    │◀────│  App Router │◀────│   Routes    │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Page      │     │  Database   │
                    │ (Server)    │     │  (Prisma)   │
                    └──────┬──────┘     └─────────────┘
                           │
                           ▼  (Server → Client boundary)
                    ┌─────────────┐
                    │   Store     │
                    │ (Zustand)   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Feature   │
                    │ Components  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Present.  │
                    │ Components  │
                    └─────────────┘
```

**数据流方向:**
1. **Server → Client (单向):** Page 组件获取数据后传递给 Client 组件
2. **Client → Server (API):** 用户交互触发 API 调用，更新后重新验证
3. **Store → Components (订阅):** Zustand store 变化通知订阅的组件

## 遵循的模式

### 模式 1: Server/Client 组件分离

**是什么:** Next.js 15 核心模式，Server 组件负责数据获取，Client 组件负责交互

**何时使用:**
- 需要访问数据库/文件系统 → Server Component
- 需要 useState/useEffect/event handlers → Client Component
- 大型列表/表格 → 优先 Server，边界处转 Client

**示例:**
```typescript
// src/app/projects/[id]/page.tsx (Server Component)
import { getProject } from '@/lib/api/projects'
import { ProjectClient } from './ProjectClient'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  return <ProjectClient initialData={project} />
}

// src/app/projects/[id]/ProjectClient.tsx (Client Component)
"use client"
export function ProjectClient({ initialData }) {
  const { data, mutate } = useProject(initialData.id)
  // ... interactive logic
}
```

### 模式 2: Colocated Features (特性并列)

**是什么:** 按业务特性组织代码，而非按技术类型分层

**何时使用:** 中型以上项目，多团队并行开发

**目录结构:**
```
src/
├── app/                    # 路由定义
│   ├── (auth)/            # 认证相关页面
│   ├── (main)/            # 主应用布局
│   ├── projects/          # 项目管理特性
│   ├── tasks/             # 任务管理特性
│   └── risks/             # 风险管理特性
├── components/
│   ├── ui/                # 通用 UI 组件 (shadcn/ui)
│   ├── layout/            # 布局组件
│   └── [feature]/         # 特性组件
│       ├── TaskList.tsx
│       ├── TaskCard.tsx
│       └── TaskForm.tsx
├── hooks/
│   ├── use[Feature].ts    # 特性 Hooks
│   └── use-toast.ts
└── stores/
    ├── [feature]Store.ts  # 特性 Store
    └── uiStore.ts         # 全局 UI Store
```

### 模式 3: Zustand Store 切片模式

**是什么:** 按特性拆分 Store，避免单一大型 Store

**何时使用:** 应用有 3+ 个独立业务领域

**示例:**
```typescript
// stores/boardStore.ts
export const useBoardStore = create()(/* board logic */)

// stores/uiStore.ts
export const useUIStore = create()(/* UI state */)

// 组件中使用
const { activeBoard } = useBoardStore()
const { sidebarCollapsed } = useUIStore()
```

### 模式 4: CSS Variables 主题系统

**是什么:** 使用 CSS 自定义属性实现主题切换

**何时使用:** 需要深色/浅色模式，或多主题支持

**实现方式:**
```css
/* globals.css */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

## 避免的反模式

### 反模式 1: Client-Only 应用

**是什么:** 所有组件都是 Client Component，失去 SSR 优势

**为什么糟糕:**
- 首屏加载变慢 (无 HTML 直出)
- SEO 受损
- 移动端性能差

**正确做法:** 尽可能使用 Server Component，仅在需要交互时使用 Client

### 反模式 2: 全局状态滥用

**是什么:** 所有状态都放入 Zustand/Redux，包括 UI 本地状态

**为什么糟糕:**
- 不必要的重渲染
- 状态追踪困难
- 调试复杂度增加

**正确做法:**
- 本地状态 → `useState`
- 表单状态 → `useForm` (React Hook Form)
- 跨组件共享 → Zustand
- 服务端数据 → TanStack Query

### 反模式 3: 组件过度耦合

**是什么:** 组件直接依赖 Store 而非 Props，难以测试和复用

**为什么糟糕:**
- 单元测试需要 Mock 整个 Store
- 组件无法脱离业务场景使用
- 代码重复

**正确做法:**
- Container/Presenter 分离
- 自定义 Hooks 封装 Store 访问
- 基础组件纯 Props 驱动

## 可扩展性考虑

| 关注点 | 100 用户 | 10K 用户 | 1M 用户 |
|--------|----------|----------|---------|
| **组件加载** | 全量打包 | 按路由分块 | 微前端拆分 |
| **状态管理** | 单 Store | 切片 Store | 分布式状态 |
| **主题系统** | CSS 变量 | CSS 变量 + 按需加载 | 主题 CDN |
| **数据获取** | 客户端请求 | ISR + 缓存 | Edge + CDN |

## 构建顺序

组件间的依赖关系决定了构建顺序:

```
Phase 1: UI Primitive 层
├── Button, Input, Card 等基础组件
├── Theme Provider (深色/浅色切换)
└── 依赖：Tailwind CSS, Radix UI

Phase 2: Layout 层
├── AppLayout, Sidebar, Header
├── 依赖：Phase 1 基础组件
└── 集成：Zustand UI Store

Phase 3: Feature Hooks 层
├── useAuth, useBoard, useTasks
├── 依赖：API Client, TanStack Query
└── 封装：Zustand Store 访问

Phase 4: Smart Components 层
├── TaskList, KanbanBoard, RiskMatrix
├── 依赖：Phase 2 Layout, Phase 3 Hooks
└── 组合：Phase 1 Dumb Components

Phase 5: Page 层
├── 路由页面组件
├── 依赖：Phase 3, Phase 4
└── 集成：Server-Side Data Fetching
```

## 主题系统设计

### 架构

```
┌─────────────────────────────────────┐
│         Theme Provider              │
│  (Next-Themes / 自定义 Context)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      CSS Variables (globals.css)    │
│  :root { --bg, --fg, --primary }    │
│  .dark { --bg, --fg, --primary }    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Tailwind Config Extension      │
│  colors: { background: hsl(var(--)) }│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Component Usage                │
│  className="bg-background text-fg"  │
└─────────────────────────────────────┘
```

### 实现步骤

1. **定义 CSS 变量** (`src/app/globals.css`):
   - 浅色模式变量在 `:root`
   - 深色模式变量在 `.dark`
   - 使用 OKLCH 色域获得更好的一致性

2. **扩展 Tailwind 配置** (`tailwind.config.ts`):
   - 将 CSS 变量映射为 `colors.background`, `colors.primary` 等
   - 使用 `hsl(var(--variable))` 格式

3. **创建 Theme Toggle 组件**:
   ```typescript
   // components/theme/ThemeToggle.tsx
   "use client"
   export function ThemeToggle() {
     const [theme, setTheme] = useTheme() // next-themes
     return (
       <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
         {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
       </button>
     )
   }
   ```

4. **推荐库**: `next-themes` (与 Next.js 完美集成，避免 hydration 问题)

## 来源

- Next.js 15 官方文档 - Server/Client Components
- Zustand 官方文档 - State Management Best Practices
- shadcn/ui - Component Architecture
- Radix UI - Headless Component Patterns
- Tailwind CSS 4 - CSS Variables Theming
