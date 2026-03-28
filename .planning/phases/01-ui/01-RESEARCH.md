# Phase 1: UI 基础设施 - Research

**Researched:** 2026-03-25
**Domain:** Next.js 布局组件、Zustand 状态持久化、响应式 UI
**Confidence:** HIGH

## Summary

本阶段目标是建立稳定的 UI 布局基础架构，包括可折叠侧边栏（状态持久化）和响应式 Header。现有代码已有基本的侧边栏折叠实现和响应式 Header，但缺少状态持久化和完善的移动端适配。

**Primary recommendation:** 扩展现有 uiStore 添加 persist 中间件，复用现有 Sidebar 和 Header 组件结构，添加 Sheet 组件用于移动端导航抽屉。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 折叠模式为「仅图标模式」— 收起后显示图标+Tooltip，参考 Plane/Linear 设计风格
- **D-02:** 折叠触发方式为「专用按钮」— 在侧边栏顶部或底部放置展开/收起按钮
- **D-03:** 折叠状态持久化存储到 localStorage，刷新页面后保持
- **D-04:** Header 固定在顶部（`position: fixed`），不随滚动消失
- **D-05:** Header 在移动端采用「精简显示」策略 — 搜索/通知/用户菜单折叠到抽屉或下拉菜单

### Claude's Discretion
- 侧边栏动画过渡效果
- Header 高度和样式细节
- 具体的响应式断点数值

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAYOUT-01 | 可折叠侧边栏导航，支持展开/收起状态持久化 | 现有 Sidebar.tsx 已实现折叠功能；需扩展 uiStore 添加 persist 中间件实现持久化 |
| LAYOUT-03 | 响应式 Header，包含搜索、通知、用户菜单 | 现有 Header.tsx 有基本响应式；需添加 Sheet 组件用于移动端导航抽屉 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.2 | 状态管理 | 项目已使用，支持 persist 中间件持久化 |
| @radix-ui/react-dialog | 1.1.15 | Sheet/抽屉组件基础 | 项目已安装，shadcn/ui Sheet 基于此构建 |
| @radix-ui/react-tooltip | 1.2.8 | 折叠状态 Tooltip | 项目已使用于 Sidebar，用于显示收起时的导航文字 |
| lucide-react | 0.468.0 | 图标库 | 项目已使用，包含所需导航和操作图标 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwind-merge | 2.6.1 | 类名合并 | 已有 cn() 工具函数，用于条件样式 |
| class-variance-authority | 0.7.1 | 组件变体 | 用于 Sheet 组件方向变体定义 |
| framer-motion | 12.38.0 | 动画过渡 | 可选：用于侧边栏折叠动画增强 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Dialog (Sheet) | @radix-ui/react-popover | Popover 不适合全屏抽屉导航，Dialog 更适合移动端场景 |
| Zustand persist | localStorage 直接操作 | persist 中间件提供更好的 API 和 hydration 处理 |

**Installation:**
无需额外安装，所有依赖已存在于 package.json 中。需要添加 Sheet 组件（基于现有 @radix-ui/react-dialog）。

**Version verification:**
```bash
npm view zustand version   # 5.0.12 (项目使用 5.0.2，兼容)
npm view lucide-react version  # 0.468.0 (项目版本一致)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx    # 主布局容器（已有，需修改）
│   │   ├── Sidebar.tsx      # 侧边栏（已有，需增强持久化）
│   │   ├── Header.tsx       # 顶部栏（已有，需增强移动端）
│   │   └── MobileNav.tsx    # 新增：移动端导航抽屉
│   └── ui/
│       ├── sheet.tsx        # 新增：Sheet 组件（移动端抽屉）
│       └── tooltip.tsx      # 已有：Tooltip 组件
├── stores/
│   └── uiStore.ts           # UI 状态（需添加 persist）
└── hooks/
    └── useMediaQuery.ts     # 新增：响应式断点检测 hook
```

### Pattern 1: Zustand Persist 中间件
**What:** 使用 Zustand persist 中间件持久化侧边栏折叠状态
**When to use:** 需要跨页面刷新保持 UI 状态时
**Example:**
```typescript
// 来源: 项目现有 boardStore.ts 和 authStore.ts 模式
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  // 用于 SSR hydration
  _hydrated: boolean
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setHydrated: (state: boolean) => void
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      _hydrated: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setHydrated: (state) => set({ _hydrated: state }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
```

### Pattern 2: SSR Hydration 处理
**What:** 防止服务端渲染和客户端状态不一致导致的闪烁
**When to use:** 使用 localStorage 持久化状态时必须处理
**Example:**
```typescript
// 组件中的 hydration 检测
'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function Sidebar() {
  const [mounted, setMounted] = useState(false)
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const _hydrated = useUIStore((state) => state._hydrated)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 等待 hydration 完成后再渲染折叠状态
  if (!mounted || !_hydrated) {
    return <SidebarSkeleton />
  }

  return <SidebarContent collapsed={sidebarCollapsed} />
}
```

### Pattern 3: Sheet 组件用于移动端导航
**What:** 使用 Radix Dialog 构建侧滑抽屉，用于移动端导航
**When to use:** 屏幕宽度小于断点时，替代侧边栏显示
**Example:**
```typescript
// 来源: shadcn/ui Sheet 组件模式
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: 'left' | 'right' }
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 h-full bg-background shadow-lg transition ease-in-out',
        side === 'left' && 'inset-y-0 left-0 w-3/4 border-r',
        side === 'right' && 'inset-y-0 right-0 w-3/4 border-l',
        className
      )}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
))
```

### Pattern 4: 响应式断点检测
**What:** 使用自定义 hook 检测屏幕宽度，切换布局模式
**When to use:** 需要根据屏幕尺寸切换组件行为时
**Example:**
```typescript
// 来源: Tailwind CSS 断点约定
import { useState, useEffect } from 'react'

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export function useMediaQuery(breakpoint: keyof typeof BREAKPOINTS) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [breakpoint])

  return matches
}

// 使用示例
function AppLayout({ children }) {
  const isMobile = !useMediaQuery('md') // < 768px 视为移动端

  return isMobile ? <MobileLayout>{children}</MobileLayout> : <DesktopLayout>{children}</DesktopLayout>
}
```

### Anti-Patterns to Avoid
- **直接在组件中使用 localStorage:** 会导致 SSR 报错，必须使用 Zustand persist 或 useEffect 延迟访问
- **忽略 hydration 状态:** 会导致页面刷新时布局闪烁，必须等待客户端 hydration 完成
- **使用 CSS transform 折叠侧边栏:** 对于持久化状态，应该直接渲染不同宽度而非 CSS 动画隐藏，避免 hydration 不一致

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 侧边栏状态持久化 | 自己写 localStorage 读写 | Zustand persist 中间件 | 自动处理 hydration、序列化、错误边界 |
| 移动端抽屉导航 | 自己写 CSS 动画抽屉 | Radix Dialog (Sheet) | 已有依赖，处理焦点管理、ESC 关闭、滚动锁定 |
| 响应式断点检测 | 硬编码 window.innerWidth | useMediaQuery hook | 可测试、可复用、与 Tailwind 断点一致 |
| Tooltip 显示逻辑 | 手动管理显示/隐藏 | Radix Tooltip | 已有组件，处理边界检测、延迟显示 |

**Key insight:** 项目已有成熟的 Radix UI 组件和 Zustand persist 使用模式，应复用而非重新发明轮子。

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch
**What goes wrong:** 服务端渲染的默认状态与客户端 localStorage 恢复的状态不一致，导致 React hydration 错误
**Why it happens:** Zustand persist 使用 localStorage，但服务端渲染时无法访问 localStorage
**How to avoid:** 使用 `_hydrated` 状态标记，在 hydration 完成前渲染占位骨架
**Warning signs:** 控制台出现 "Hydration failed because the initial UI does not match what was rendered on the server" 错误

### Pitfall 2: 布局闪烁 (Layout Flash)
**What goes wrong:** 页面加载时侧边栏先显示展开状态再突然变为折叠状态
**Why it happens:** React 组件在 hydration 后才读取 localStorage，导致短暂显示默认状态
**How to avoid:**
1. 使用 Zustand persist 的 `onRehydrateStorage` 回调设置 hydration 状态
2. 在 hydration 完成前显示骨架屏或 loading 状态
**Warning signs:** 页面刷新时布局元素位置跳变

### Pitfall 3: 移动端触摸区域过小
**What goes wrong:** 折叠后的侧边栏图标太小，移动端用户难以点击
**Why it happens:** 仅考虑桌面端设计，忽略移动端触摸友好性要求（最小 44x44px）
**How to avoid:**
1. 使用 `min-h-[44px] min-w-[44px]` 确保触摸区域
2. 移动端使用 Sheet 抽屉替代折叠侧边栏
**Warning signs:** 移动端点击导航项困难或误触

### Pitfall 4: 固定 Header 导致内容遮挡
**What goes wrong:** Header 使用 `position: fixed` 后，页面内容被 Header 遮挡
**Why it happens:** fixed 元素脱离文档流，不占据空间
**How to avoid:** 在主内容区域添加 `padding-top` 或 `mt-[header-height]`，Header 高度建议 56-64px
**Warning signs:** 页面顶部内容被 Header 覆盖，滚动后才能看到

## Code Examples

Verified patterns from existing codebase:

### 现有 Sidebar 折叠模式 (Sidebar.tsx)
```typescript
// 来源: src/components/layout/Sidebar.tsx
// 已实现：折叠状态、Tooltip 显示、图标模式
<TooltipProvider delayDuration={0}>
  <aside
    className={cn(
      'bg-card border-border flex h-screen flex-col border-r transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-64',
      className
    )}
  >
    {/* 导航项 */}
    <Tooltip key={item.path} delayDuration={0}>
      <TooltipTrigger asChild>
        <Link href={item.path} className={cn('flex items-center gap-3 rounded-md px-3 py-2')}>
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className={collapsed ? 'hidden' : 'block'}>{item.title}</span>
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
    </Tooltip>
  </aside>
</TooltipProvider>
```

### 现有 Zustand Persist 模式 (boardStore.ts)
```typescript
// 来源: src/stores/boardStore.ts
import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

export const useBoardStore = create<BoardState & BoardActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // state and actions
      }),
      {
        name: 'board-storage',
        partialize: (state) => ({
          viewStates: state.viewStates,
        }),
      }
    )
  )
)
```

### 现有 Header 响应式模式 (Header.tsx)
```typescript
// 来源: src/components/layout/Header.tsx
// 已实现：响应式面包屑隐藏、搜索框响应式
<header className="bg-background/95 supports-[backdrop-filter] sticky top-0 z-50 border-b backdrop-blur">
  <div className="flex h-14 items-center justify-between px-6">
    {/* 面包屑导航 - 移动端隐藏 */}
    <Breadcrumb items={breadcrumbs} className="hidden md:flex" />

    {/* 搜索框 - 已有响应式 */}
    <div className="max-w-md flex-1 md:ml-4">
      <input className="..." />
      <kbd className="hidden sm:inline-flex">⌘K</kbd>
    </div>

    {/* 用户信息 - 移动端隐藏部分 */}
    <div className="hidden md:block">
      <p className="text-sm">{user?.name}</p>
    </div>
  </div>
</header>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage 直接读写 | Zustand persist 中间件 | 项目已采用 | 自动 hydration 处理，代码更简洁 |
| CSS 隐藏折叠内容 | 条件渲染隐藏内容 | 项目已采用 | 更好的可访问性，减少 DOM 节点 |
| 固定断点硬编码 | Tailwind 响应式断点 | 项目已采用 | 与设计系统一致，易于维护 |

**Deprecated/outdated:**
- 无过时模式，项目已采用现代最佳实践

## Open Questions

1. **Sheet 组件是否需要从 shadcn/ui 添加？**
   - What we know: 项目已有 @radix-ui/react-dialog 依赖
   - What's unclear: 是否需要完整的 shadcn/ui Sheet 组件还是基于 Dialog 简化实现
   - Recommendation: 创建简化版 Sheet 组件，仅实现 left/right 侧滑，足够满足移动端导航需求

2. **动画过渡效果复杂度？**
   - What we know: 项目已安装 framer-motion，现有 Sidebar 使用 CSS transition
   - What's unclear: 是否需要更复杂的动画效果
   - Recommendation: 保持现有 CSS transition，简单高效；如需增强，可在 Claude's Discretion 范围内添加

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test:unit -- --reporter=dot` |
| Full suite command | `npm run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | 侧边栏折叠/展开状态切换 | unit | `vitest run tests/unit/stores/uiStore.test.ts` | Wave 0 |
| LAYOUT-01 | 折叠状态 localStorage 持久化 | unit | `vitest run tests/unit/stores/uiStore.test.ts` | Wave 0 |
| LAYOUT-01 | SSR hydration 无闪烁 | integration | `vitest run tests/unit/components/layout/Sidebar.test.tsx` | Wave 0 |
| LAYOUT-03 | Header 响应式显示/隐藏 | unit | `vitest run tests/unit/components/layout/Header.test.tsx` | Wave 0 |
| LAYOUT-03 | 移动端 Sheet 导航 | unit | `vitest run tests/unit/components/layout/MobileNav.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit -- --reporter=dot`
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/stores/uiStore.test.ts` — covers LAYOUT-01 state persistence
- [ ] `tests/unit/components/layout/Sidebar.test.tsx` — covers LAYOUT-01 collapse behavior
- [ ] `tests/unit/components/layout/Header.test.tsx` — covers LAYOUT-03 responsive behavior
- [ ] `tests/unit/components/layout/MobileNav.test.tsx` — covers LAYOUT-03 mobile navigation
- [ ] `tests/unit/hooks/useMediaQuery.test.ts` — covers responsive breakpoint detection
- [ ] `src/components/ui/sheet.tsx` — Sheet component for mobile drawer

## Sources

### Primary (HIGH confidence)
- 项目现有代码: `src/stores/boardStore.ts` - Zustand persist 模式
- 项目现有代码: `src/components/layout/Sidebar.tsx` - 折叠实现
- 项目现有代码: `src/components/layout/Header.tsx` - 响应式实现
- package.json - 依赖版本确认

### Secondary (MEDIUM confidence)
- Zustand 官方文档 - persist 中间件使用模式（项目已验证）

### Tertiary (LOW confidence)
- 无

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 基于项目现有依赖和模式
- Architecture: HIGH - 基于现有代码分析和 CONTEXT.md 决策
- Pitfalls: HIGH - 基于 Next.js SSR 和 Zustand 最佳实践

**Research date:** 2026-03-25
**Valid until:** 30 days - 稳定的 UI 模式和依赖版本