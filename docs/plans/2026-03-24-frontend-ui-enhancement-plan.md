# 前端 UI/UX 改进实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 全面提升项目管理系统的 UI/UX 体验，包括视觉风格、交互体验、布局导航和数据展示

**Architecture:** 采用渐进式改进策略，从基础组件到业务组件，从单一功能到系统级优化。保持现有功能不变，仅增强视觉和交互体验。

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion, Zustand

---

## 阶段一：基础体验优化（优先级：高）

### Task 1: 创建骨架屏组件库

**Files:**

- Create: `src/components/ui/skeleton.tsx`
- Test: `src/components/ui/__tests__/skeleton.test.tsx`

**Step 1: 安装依赖**

```bash
npm install @radix-ui/react-slot
```

**Step 2: 创建 Skeleton 组件**

```tsx
// src/components/ui/skeleton.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { className, variant = 'default', width, height, animation = 'pulse', style, ...props },
    ref
  ) => {
    const variantStyles = {
      default: 'rounded-md',
      circular: 'rounded-full',
      text: 'rounded h-4',
      rectangular: 'rounded-lg',
    }

    const animationStyles = {
      pulse: 'animate-pulse',
      wave: 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]',
      none: '',
    }

    return (
      <div
        ref={ref}
        className={cn('bg-muted', variantStyles[variant], animationStyles[animation], className)}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

// 预设骨架屏模板
const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('space-y-3 rounded-xl border p-4', className)}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-20 w-full" />
  </div>
)

const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="overflow-hidden rounded-lg border">
    <div className="bg-muted/50 flex gap-4 p-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 border-t p-3">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

const SkeletonMetric = () => (
  <div className="rounded-xl border p-5">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton variant="circular" className="h-12 w-12" />
    </div>
  </div>
)

export { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonMetric }
```

**Step 3: 添加 shimmer 动画到 Tailwind**

```ts
// 在 tailwind.config.ts 的 theme.extend 中添加:
animation: {
  shimmer: "shimmer 2s linear infinite",
},
keyframes: {
  shimmer: {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
},
```

**Step 4: 验证组件可用**

```bash
npm run typecheck
```

**Step 5: 提交**

```bash
git add src/components/ui/skeleton.tsx tailwind.config.ts
git commit -m "feat(ui): 添加骨架屏组件库

- 支持 default/circular/text/rectangular 变体
- 支持 pulse/wave/none 动画模式
- 预设 Card/List/Table/Metric 模板"
```

---

### Task 2: 改进 MetricCard 骨架屏加载状态

**Files:**

- Modify: `src/components/dashboard/MetricCard.tsx`

**Step 1: 导入 SkeletonMetric**

```tsx
// 在文件顶部添加
import { SkeletonMetric } from '@/components/ui/skeleton'
```

**Step 2: 更新 StatsGrid 组件**

```tsx
// 替换 StatsGrid 中的 loading 渲染逻辑
export function StatsGrid({ loading }: StatsGridProps) {
  // ... 现有代码 ...

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonMetric key={i} />
        ))}
      </div>
    )
  }

  // ... 现有代码 ...
}
```

**Step 3: 验证功能**

```bash
npm run dev
# 访问 /dashboard 查看加载状态
```

**Step 4: 提交**

```bash
git add src/components/dashboard/MetricCard.tsx
git commit -m "feat(dashboard): 使用 SkeletonMetric 替换简单的加载占位"
```

---

### Task 3: 改进 TaskBoard 骨架屏加载状态

**Files:**

- Modify: `src/components/dashboard/TaskBoard.tsx`

**Step 1: 导入 SkeletonList**

```tsx
import { SkeletonList } from '@/components/ui/skeleton'
```

**Step 2: 替换现有加载状态**

```tsx
// 将现有的加载状态替换为:
{loading ? (
  <SkeletonList count={4} />
) : (
  // ... 现有代码 ...
)}
```

**Step 3: 验证功能**

```bash
npm run dev
```

**Step 4: 提交**

```bash
git add src/components/dashboard/TaskBoard.tsx
git commit -m "feat(dashboard): TaskBoard 使用 SkeletonList 加载状态"
```

---

### Task 4: 改进 RiskOverview 骨架屏加载状态

**Files:**

- Modify: `src/components/dashboard/RiskOverview.tsx`

**Step 1: 查看当前实现**

```bash
cat src/components/dashboard/RiskOverview.tsx
```

**Step 2: 添加骨架屏**

根据实际组件结构添加对应的骨架屏加载状态。

**Step 3: 提交**

```bash
git add src/components/dashboard/RiskOverview.tsx
git commit -m "feat(dashboard): RiskOverview 添加骨架屏加载状态"
```

---

### Task 5: 创建全局命令面板组件

**Files:**

- Create: `src/components/ui/command-palette.tsx`
- Create: `src/hooks/useCommandPalette.ts`
- Modify: `src/app/providers.tsx`

**Step 1: 安装 cmdk 依赖**

```bash
npm install cmdk
```

**Step 2: 创建 useCommandPalette Hook**

```tsx
// src/hooks/useCommandPalette.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
  group?: string
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  // 全局快捷键 ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
      // ESC 关闭
      if (e.key === 'Escape' && open) {
        close()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle, close, open])

  // 默认命令项
  const defaultCommands: CommandItem[] = [
    {
      id: 'go-dashboard',
      title: '前往工作台',
      description: '查看仪表盘概览',
      action: () => router.push('/dashboard'),
      group: '导航',
    },
    {
      id: 'go-projects',
      title: '前往项目列表',
      description: '管理所有项目',
      action: () => router.push('/projects'),
      group: '导航',
    },
    {
      id: 'go-tasks',
      title: '前往任务列表',
      description: '查看我的任务',
      action: () => router.push('/tasks'),
      group: '导航',
    },
    {
      id: 'new-project',
      title: '创建新项目',
      description: '开始一个新项目',
      action: () => router.push('/projects/new'),
      group: '创建',
    },
    {
      id: 'new-task',
      title: '创建新任务',
      description: '添加一个新任务',
      action: () => router.push('/tasks/new'),
      group: '创建',
    },
    {
      id: 'go-settings',
      title: '打开设置',
      description: '个人偏好设置',
      action: () => router.push('/settings'),
      group: '设置',
    },
  ]

  return {
    open,
    setOpen,
    toggle,
    close,
    commands: defaultCommands,
  }
}
```

**Step 3: 创建 CommandPalette 组件**

```tsx
// src/components/ui/command-palette.tsx
'use client'

import * as React from 'react'
import { Command } from 'cmdk'
import { cn } from '@/lib/utils'
import { useCommandPalette, type CommandItem } from '@/hooks/useCommandPalette'
import { Search, ArrowRight, FileText, Folder, CheckSquare, Settings, Plus } from 'lucide-react'

// 图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  navigation: ArrowRight,
  create: Plus,
  settings: Settings,
  default: FileText,
}

function CommandItem({ item, onSelect }: { item: CommandItem; onSelect: () => void }) {
  const Icon = item.icon || iconMap[item.group?.toLowerCase() || 'default'] || FileText

  return (
    <Command.Item
      value={`${item.title} ${item.description || ''}`}
      onSelect={() => {
        item.action()
        onSelect()
      }}
      className="aria-selected:bg-accent aria-selected:text-accent-foreground flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5"
    >
      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{item.title}</div>
        {item.description && (
          <div className="text-muted-foreground truncate text-xs">{item.description}</div>
        )}
      </div>
      {item.shortcut && (
        <kbd className="bg-muted text-muted-foreground hidden h-5 items-center gap-1 rounded border px-1.5 text-[10px] sm:inline-flex">
          {item.shortcut}
        </kbd>
      )}
    </Command.Item>
  )
}

export function CommandPalette() {
  const { open, setOpen, close, commands } = useCommandPalette()

  // 按分组整理命令
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    commands.forEach((cmd) => {
      const group = cmd.group || '其他'
      if (!groups[group]) groups[group] = []
      groups[group].push(cmd)
    })
    return groups
  }, [commands])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Command Dialog */}
      <div className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2">
        <Command className="bg-popover overflow-hidden rounded-xl border shadow-2xl" loop>
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="text-muted-foreground mr-2 h-4 w-4" />
            <Command.Input
              placeholder="搜索命令或页面..."
              className="placeholder:text-muted-foreground h-12 flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
            <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 text-[10px] sm:inline-flex">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
              未找到相关命令
            </Command.Empty>

            {Object.entries(groupedCommands).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
              >
                <div className="space-y-1">
                  {items.map((item) => (
                    <CommandItem key={item.id} item={item} onSelect={close} />
                  ))}
                </div>
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded border px-1">↑</kbd>
                <kbd className="bg-muted rounded border px-1">↓</kbd>
                选择
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded border px-1">↵</kbd>
                确认
              </span>
            </div>
            <span>⌘K 打开/关闭</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
```

**Step 4: 集成到 providers.tsx**

```tsx
// 在 src/app/providers.tsx 中添加 CommandPalette
import { CommandPalette } from '@/components/ui/command-palette'

// 在 return 的最外层添加:
;<CommandPalette />
```

**Step 5: 验证功能**

```bash
npm run dev
# 访问任意页面，按 ⌘K 或 Ctrl+K 测试命令面板
```

**Step 6: 提交**

```bash
git add src/components/ui/command-palette.tsx src/hooks/useCommandPalette.ts src/app/providers.tsx package.json
git commit -m "feat(ui): 添加全局命令面板组件

- 支持 ⌘K / Ctrl+K 快捷键
- 分组展示命令列表
- 键盘导航支持
- 预置导航和创建命令"
```

---

### Task 6: 改进 Sidebar 折叠动画和交互

**Files:**

- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: 添加更流畅的折叠动画**

```tsx
// 在 Sidebar 组件中，优化折叠状态的 CSS 类:
<aside
  className={cn(
    "bg-card border-r border-border flex flex-col h-screen",
    "transition-all duration-300 ease-in-out",
    collapsed ? "w-16" : "w-64",
    className
  )}
>
```

**Step 2: 添加 Tooltip 支持**

```bash
npm install @radix-ui/react-tooltip
```

```tsx
// 创建 src/components/ui/tooltip.tsx
'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

**Step 3: 在 Sidebar 中使用 Tooltip**

```tsx
// 在 Sidebar 中，当折叠时显示 Tooltip:
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

// 包裹整个 Sidebar:
<TooltipProvider delayDuration={0}>
  <aside className={...}>
    {/* ... */}
    <nav>
      {navItems.map((item) => (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>
            <Link href={item.path} className={...}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={collapsed ? "hidden" : "block"}>
                {item.title}
              </span>
            </Link>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">
              {item.title}
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </nav>
  </aside>
</TooltipProvider>
```

**Step 4: 验证功能**

```bash
npm run dev
# 测试 Sidebar 折叠动画和 Tooltip
```

**Step 5: 提交**

```bash
git add src/components/layout/Sidebar.tsx src/components/ui/tooltip.tsx
git commit -m "feat(layout): 改进 Sidebar 折叠动画和 Tooltip 支持

- 添加流畅的折叠动画
- 折叠状态下显示 Tooltip
- 改善用户体验"
```

---

### Task 7: 添加面包屑导航组件

**Files:**

- Create: `src/components/ui/breadcrumb.tsx`
- Modify: `src/components/layout/Header.tsx`

**Step 1: 创建 Breadcrumb 组件**

```tsx
// src/components/ui/breadcrumb.tsx
import * as React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center gap-1.5">
        {/* Home */}
        <li>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground flex items-center transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {/* Items */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="text-muted-foreground h-4 w-4" />
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
```

**Step 2: 创建 useBreadcrumbs Hook**

```tsx
// src/hooks/useBreadcrumbs.ts
'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

const routeLabels: Record<string, string> = {
  dashboard: '工作台',
  projects: '项目',
  tasks: '任务',
  reviews: '评审',
  risks: '风险',
  milestones: '里程碑',
  issues: '问题',
  settings: '设置',
  profile: '个人资料',
  preferences: '偏好设置',
  admin: '管理',
  users: '用户管理',
  new: '新建',
}

export function useBreadcrumbs() {
  const pathname = usePathname()

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: { label: string; href?: string }[] = []

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // 跳过动态路由段（如 [id]）
      if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
        // 如果是 ID，使用前一个段的标签或 '详情'
        const prevLabel = breadcrumbs[breadcrumbs.length - 1]?.label || '详情'
        breadcrumbs.push({ label: '详情', href: currentPath })
        return
      }

      const label = routeLabels[segment] || segment
      const isLast = index === segments.length - 1

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      })
    })

    return breadcrumbs
  }, [pathname])
}
```

**Step 3: 在 Header 中集成**

```tsx
// 修改 src/components/layout/Header.tsx
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs'

// 在 Header 组件中:
const breadcrumbs = useBreadcrumbs()

// 在搜索框之前添加:
<div className="flex items-center gap-4">
  <Breadcrumb items={breadcrumbs} />

  {/* 现有的搜索框 */}
  <div className="flex-1 max-w-md">
    ...
  </div>
</div>
```

**Step 4: 验证功能**

```bash
npm run dev
# 导航到不同页面查看面包屑
```

**Step 5: 提交**

```bash
git add src/components/ui/breadcrumb.tsx src/hooks/useBreadcrumbs.ts src/components/layout/Header.tsx
git commit -m "feat(layout): 添加面包屑导航组件

- 自动根据路由生成面包屑
- 支持 Home 图标快速返回
- 当前页面高亮显示"
```

---

## 阶段二：视觉升级

### Task 8: 引入 Framer Motion 动画库

**Files:**

- Modify: `package.json`

**Step 1: 安装依赖**

```bash
npm install framer-motion
```

**Step 2: 创建动画配置文件**

```tsx
// src/lib/animations.ts
export const transitions = {
  spring: {
    type: 'spring',
    stiffness: 260,
    damping: 20,
  },
  springBouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  },
  ease: {
    duration: 0.2,
    ease: [0.25, 0.1, 0.25, 1],
  },
}

export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
}

// 列表项交错动画
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}
```

**Step 3: 提交**

```bash
git add package.json src/lib/animations.ts
git commit -m "chore: 添加 Framer Motion 动画配置"
```

---

### Task 9: 为卡片添加进入动画

**Files:**

- Modify: `src/components/dashboard/MetricCard.tsx`
- Modify: `src/components/dashboard/TaskBoard.tsx`

**Step 1: 更新 MetricCard 使用动画**

```tsx
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, transitions } from '@/lib/animations'

// 在 StatsGrid 中:
return (
  <motion.div
    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    variants={staggerContainer}
    initial="initial"
    animate="animate"
  >
    {metrics.map((metric) => (
      <motion.div key={metric.title} variants={staggerItem}>
        <MetricCard {...metric} />
      </motion.div>
    ))}
  </motion.div>
)
```

**Step 2: 更新 TaskBoard 任务列表动画**

```tsx
// 任务列表使用交错动画:
<motion.div className="space-y-2" variants={staggerContainer} initial="initial" animate="animate">
  {tasks.slice(0, 5).map((task, index) => (
    <motion.div key={task.id} variants={staggerItem} layout>
      {/* 任务卡片内容 */}
    </motion.div>
  ))}
</motion.div>
```

**Step 3: 验证动画效果**

```bash
npm run dev
# 刷新 Dashboard 查看卡片进入动画
```

**Step 4: 提交**

```bash
git add src/components/dashboard/MetricCard.tsx src/components/dashboard/TaskBoard.tsx
git commit -m "feat(dashboard): 为卡片添加进入动画

- 统计卡片交错淡入效果
- 任务列表交错滑入效果
- 使用 Framer Motion 实现"
```

---

### Task 10: 优化主题色彩系统

**Files:**

- Modify: `src/app/globals.css`

**Step 1: 添加品牌强调色**

```css
/* 在 :root 中添加 */
:root {
  /* ... 现有变量 ... */

  /* 品牌色 */
  --brand-50: oklch(0.97 0.02 260);
  --brand-100: oklch(0.93 0.04 260);
  --brand-200: oklch(0.86 0.08 260);
  --brand-300: oklch(0.76 0.12 260);
  --brand-400: oklch(0.64 0.16 260);
  --brand-500: oklch(0.52 0.2 260);
  --brand-600: oklch(0.44 0.2 260);
  --brand-700: oklch(0.37 0.18 260);
  --brand-800: oklch(0.31 0.14 260);
  --brand-900: oklch(0.27 0.1 260);

  /* 将 primary 替换为品牌色 */
  --primary: var(--brand-600);
  --primary-foreground: oklch(0.985 0 0);
}

.dark {
  /* 暗色主题下的品牌色 */
  --brand-500: oklch(0.6 0.2 260);
  --brand-600: oklch(0.55 0.2 260);

  --primary: var(--brand-500);
  --primary-foreground: oklch(0.145 0 0);
}
```

**Step 2: 更新欢迎区域渐变**

```tsx
// 修改 WelcomeSection 的 Card 样式:
<Card className="border-none shadow-sm bg-gradient-to-br from-brand-50 via-background to-brand-100/50 dark:from-brand-950/30 dark:via-background dark:to-brand-900/20">
```

**Step 3: 提交**

```bash
git add src/app/globals.css src/components/dashboard/WelcomeSection.tsx
git commit -m "feat(style): 优化主题色彩系统

- 添加品牌色色阶 (brand-50 到 brand-900)
- 更新欢迎区域渐变背景
- 增强视觉层次感"
```

---

### Task 11: 添加卡片悬停效果

**Files:**

- Modify: `src/components/ui/card.tsx`

**Step 1: 增强 Card 组件**

```tsx
// 在 Card 组件中添加 hover 效果
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }
>(({ className, hoverable = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-card text-card-foreground rounded-xl border shadow',
      hoverable &&
        'hover:border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
      className
    )}
    {...props}
  />
))
```

**Step 2: 在 Dashboard 卡片中使用**

```tsx
// MetricCard 中添加 hoverable
<Card hoverable className={...}>
```

**Step 3: 提交**

```bash
git add src/components/ui/card.tsx src/components/dashboard/MetricCard.tsx
git commit -m "feat(ui): Card 组件添加 hoverable 效果"
```

---

## 阶段三：功能增强

### Task 12: 实现任务看板拖拽功能

**Files:**

- Modify: `src/components/tasks/TaskKanban.tsx`
- Create: `src/hooks/useDragAndDrop.ts`

**Step 1: 安装拖拽库**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: 创建拖拽 Hook**

```tsx
// src/hooks/useDragAndDrop.ts
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

export function useDragAndDrop<T extends { id: string }>(
  initialItems: T[],
  onReorder?: (items: T[]) => void
) {
  const [items, setItems] = useState<T[]>(initialItems)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        onReorder?.(newItems)
        return newItems
      })
    }
  }

  return {
    items,
    setItems,
    sensors,
    handleDragEnd,
    DndContext,
    SortableContext,
  }
}
```

**Step 3: 更新 TaskKanban 组件**

```tsx
// 在 TaskKanban 中集成拖拽功能
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card cursor-grab rounded-lg border p-3 shadow-sm active:cursor-grabbing',
        isDragging && 'z-50 opacity-50 shadow-lg'
      )}
    >
      {/* 任务内容 */}
    </div>
  )
}
```

**Step 4: 提交**

```bash
git add src/hooks/useDragAndDrop.ts src/components/tasks/TaskKanban.tsx package.json
git commit -m "feat(tasks): 实现任务看板拖拽排序

- 使用 @dnd-kit 实现
- 支持键盘操作
- 拖拽时视觉反馈"
```

---

### Task 13: 添加表格高级筛选功能

**Files:**

- Create: `src/components/ui/data-table.tsx`
- Create: `src/components/ui/data-table-toolbar.tsx`

**Step 1: 安装 TanStack Table**

```bash
npm install @tanstack/react-table
```

**Step 2: 创建 DataTable 组件**

```tsx
// src/components/ui/data-table.tsx
'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      {/* Toolbar 将在下一个 Task 中实现 */}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-muted-foreground text-sm">
          已选择 {table.getFilteredSelectedRowModel().rows.length} /{' '}
          {table.getFilteredRowModel().rows.length} 行
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm">
            第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 页
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: 提交**

```bash
git add src/components/ui/data-table.tsx package.json
git commit -m "feat(ui): 添加 DataTable 组件

- 基于 TanStack Table
- 支持排序、筛选、分页
- 行选择功能"
```

---

## 验证清单

### 阶段一完成后验证

- [ ] 骨架屏组件正常显示
- [ ] Dashboard 各组件加载状态正确
- [ ] ⌘K 命令面板可正常打开
- [ ] Sidebar 折叠动画流畅
- [ ] 面包屑导航正确显示

### 阶段二完成后验证

- [ ] 卡片进入动画正常
- [ ] 主题色彩系统更新
- [ ] 卡片悬停效果正常
- [ ] 整体视觉效果提升

### 阶段三完成后验证

- [ ] 任务看板拖拽正常
- [ ] 表格筛选功能正常
- [ ] 所有功能无回归问题

---

## 执行建议

**推荐使用 Subagent-Driven 方式执行：**

- 每个 Task 由独立 subagent 执行
- 执行后进行 code review
- 确保每个 Task 完成后再进行下一个

**测试策略：**

- 每个 Task 完成后运行 `npm run typecheck`
- 定期运行 `npm run test:unit`
- 阶段完成后运行 `npm run test:e2e`
