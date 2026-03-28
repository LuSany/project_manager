# Phase 2: UI 功能组件 - Research

**Researched:** 2026-03-26
**Domain:** React 主题切换、命令面板增强、Zustand 状态管理
**Confidence:** HIGH

## Summary

Phase 2 需要在 Phase 1 建立的布局基础设施上实现两大核心功能：主题切换和命令面板增强。项目已有完整的 light/dark CSS 变量定义、Zustand persist 模式、以及基础的命令面板实现。研究确认：主题切换采用扩展 uiStore 方案，无需引入 next-themes；命令面板增强基于现有 cmdk 库扩展功能。

**Primary recommendation:** 扩展现有架构而非引入新库，保持代码风格统一。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 主题切换
- **D-01:** 主题切换按钮放在「用户菜单内」— 在用户头像下拉菜单中与个人信息、设置并列，点击切换
- **D-02:** 主题架构采用「扩展 uiStore」— 与现有 uiStore 模式一致，所有状态集中管理，代码风格统一
- **D-03:** 主题状态持久化到 localStorage，使用 Zustand persist 中间件（复用 Phase 1 模式）

#### 命令面板
- **D-04:** 命令面板增强四项功能：
  - 最近访问：记录最近访问的项目、任务、需求页面
  - 收藏项目：允许用户收藏常用项目或页面，始终置顶
  - 快捷操作：常用操作的快捷入口（创建任务、新建项目等）
  - AI 助手：AI 对话入口，与项目数据交互

### Claude's Discretion
- 主题切换动画效果
- 命令面板分组样式
- 最近访问记录数量上限
- 收藏项目排序方式

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAYOUT-02 | 深色/浅色主题切换，无闪烁加载 | Zustand persist + CSS 变量切换，SSR hydration 模式已验证 |
| LAYOUT-04 | 命令面板 (⌘K)，支持快速导航和搜索 | cmdk 库已安装，现有 hook 可扩展，分组渲染模式已实现 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.0.12 (project: 5.0.2) | 状态管理 | 项目已采用，persist 中间件成熟 |
| cmdk | 1.1.1 (project: 已安装) | 命令面板 | shadcn/ui 内置，API 稳定 |
| Lucide React | 1.7.0 (project: 0.468.0) | 图标库 | 项目已采用，Sun/Moon 图标可用 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dropdown-menu | 已安装 | 用户菜单下拉 | 主题切换入口（可选，也可用原生实现） |
| Tailwind CSS | 4.1.14 | CSS 框架 | 主题变量已定义 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 扩展 uiStore | next-themes | next-themes 功能更全，但增加依赖，与项目现有模式不一致 |
| cmdk | 自定义实现 | cmdk 已满足需求，重写成本高 |

**Installation:**
无需安装新包，所有依赖已在项目中。

**Version verification:**
```bash
npm view zustand version   # 5.0.12
npm view cmdk version      # 1.1.1
npm view lucide-react version  # 1.7.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── uiStore.ts           # 扩展：添加 theme、setTheme
├── hooks/
│   ├── useCommandPalette.ts # 扩展：添加最近访问、收藏
│   └── useTheme.ts          # 新增：主题切换 hook（封装 uiStore）
├── components/
│   ├── layout/
│   │   └── Header.tsx       # 修改：用户菜单添加主题切换
│   └── ui/
│       └── command-palette.tsx  # 扩展：分组增强
└── types/
    └── command.ts           # 新增：CommandItem 扩展类型
```

### Pattern 1: Zustand Persist with SSR Hydration
**What:** 使用 Zustand persist 中间件持久化主题状态，配合 `onRehydrateStorage` 处理 SSR hydration
**When to use:** 需要持久化 UI 状态且支持 SSR 的场景
**Example:**
```typescript
// Source: src/stores/uiStore.ts (已验证)
export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      // ... state
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme, // 新增：仅持久化 theme
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
```

### Pattern 2: CSS 变量主题切换
**What:** 通过切换 `<html>` 元素的 `class` 来应用不同的 CSS 变量
**When to use:** 使用 Tailwind CSS + CSS 变量的主题系统
**Example:**
```typescript
// 应用主题到 DOM
useEffect(() => {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
}, [theme])
```

```css
/* Source: src/app/globals.css (已验证) */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... more light variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... more dark variables */
}
```

### Pattern 3: 命令面板分组渲染
**What:** 使用 cmdk 的 `Command.Group` 组件按类别分组显示命令
**When to use:** 命令数量较多需要分类展示
**Example:**
```typescript
// Source: src/components/ui/command-palette.tsx (已验证)
const groupedCommands = React.useMemo(() => {
  const groups: Record<string, CommandItem[]> = {}
  commands.forEach((cmd) => {
    const group = cmd.group || '其他'
    if (!groups[group]) groups[group] = []
    groups[group].push(cmd)
  })
  return groups
}, [commands])

// 渲染
{Object.entries(groupedCommands).map(([group, items]) => (
  <Command.Group key={group} heading={group}>
    {items.map((item) => (
      <CommandItemRow key={item.id} item={item} onSelect={close} />
    ))}
  </Command.Group>
))}
```

### Anti-Patterns to Avoid
- **在 persist 中间件中持久化 activeModal** — modal 状态不需要持久化，刷新后应重置
- **直接操作 localStorage 而不通过 Zustand** — 破坏状态管理一致性
- **使用 useEffect 在组件挂载时读取 localStorage 初始值** — 会导致 SSR hydration 不匹配

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 主题切换 | 自定义 ThemeProvider | 扩展 uiStore | 已有 persist 模式，保持一致性 |
| 命令面板 | 自定义搜索/过滤逻辑 | cmdk 内置 filter | cmdk 已优化搜索体验 |
| SSR hydration | 手动检测 mounted 状态 | Zustand `_hydrated` | 已有成熟模式 |

**Key insight:** 项目已有完善的 Zustand persist 模式和 CSS 变量系统，无需引入额外依赖。

## Common Pitfalls

### Pitfall 1: SSR Hydration 不匹配
**What goes wrong:** 初始渲染时服务端没有 localStorage，客户端有，导致 hydration 错误
**Why it happens:** 服务端和客户端初始状态不同
**How to avoid:**
1. 初始状态使用默认值（如 `theme: 'light'`）
2. 使用 `_hydrated` 标记检测 rehydration 完成
3. 在 rehydration 完成前显示默认状态或加载占位
**Warning signs:** 控制台报错 "Hydration failed because the initial UI does not match"

### Pitfall 2: 主题闪烁 (FOUC)
**What goes wrong:** 页面加载时短暂显示错误主题后切换到正确主题
**Why it happens:** 主题状态在 JS 执行后才应用
**How to avoid:**
1. 在 `<html>` 元素上使用内联 script 阻塞式读取 localStorage
2. 或接受首次加载使用默认主题，后续访问无闪烁
**Warning signs:** 页面加载时颜色闪烁

### Pitfall 3: 命令面板状态残留
**What goes wrong:** 页面导航后命令面板仍然打开
**Why it happens:** `open` 状态未随路由变化重置
**How to avoid:** 在 `useEffect` 中监听路由变化并关闭面板
```typescript
useEffect(() => {
  const handleRouteChange = () => close()
  router.events?.on('routeChangeComplete', handleRouteChange)
  return () => router.events?.off('routeChangeComplete', handleRouteChange)
}, [router, close])
```
**Warning signs:** 导航后按 ESC 才发现命令面板在背后打开

### Pitfall 4: 最近访问记录无限增长
**What goes wrong:** localStorage 存储过多数据导致性能问题
**Why it happens:** 未设置记录上限
**How to avoid:** 设置上限（建议 10 条），超出时删除最旧记录
**Warning signs:** localStorage 占用过大

## Code Examples

### 主题切换扩展 uiStore
```typescript
// Source: 基于 src/stores/uiStore.ts 扩展
interface UIState {
  sidebarCollapsed: boolean
  activeModal: string | null
  _hydrated: boolean
  theme: 'light' | 'dark'  // 新增
}

type UIActions = {
  // ... existing actions
  setTheme: (theme: 'light' | 'dark') => void  // 新增
  toggleTheme: () => void  // 新增
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      // ... existing state
      theme: 'light',

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,  // 持久化主题
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
```

### 命令面板扩展类型
```typescript
// Source: 基于 src/hooks/useCommandPalette.ts 扩展
export interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
  group?: string
  // 新增字段
  type?: 'navigation' | 'action' | 'recent' | 'favorite' | 'ai'
  timestamp?: number  // 用于最近访问排序
  isFavorite?: boolean
}
```

### Header 用户菜单添加主题切换
```typescript
// Source: 基于 src/components/layout/Header.tsx 修改
import { Sun, Moon, Settings, LogOut } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

// 在用户菜单下拉中添加
const theme = useUIStore((state) => state.theme)
const toggleTheme = useUIStore((state) => state.toggleTheme)

// 菜单项
<button
  onClick={toggleTheme}
  className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
>
  {theme === 'light' ? (
    <>
      <Moon className="h-4 w-4" />
      切换到深色模式
    </>
  ) : (
    <>
      <Sun className="h-4 w-4" />
      切换到浅色模式
    </>
  )}
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-themes | Zustand persist | Phase 2 决策 | 减少依赖，保持代码一致性 |
| 单一命令列表 | 分组命令 | Phase 1 实现 | 更好的用户体验 |
| 无持久化 | localStorage 持久化 | Phase 1 实现 | 状态跨会话保持 |

**Deprecated/outdated:**
- 手动管理 CSS 类切换：应使用 React 状态驱动
- 直接操作 DOM classList：应通过 useEffect 响应状态变化

## Open Questions

1. **主题切换动画效果**
   - What we know: 用户未指定具体效果
   - What's unclear: 是否需要过渡动画、动画时长
   - Recommendation: 可选实现淡入淡出效果，使用 CSS transition

2. **最近访问记录数量上限**
   - What we know: 建议值 5-10 条
   - What's unclear: 用户偏好
   - Recommendation: 默认 10 条，可在设置中调整

3. **收藏项目排序方式**
   - What we know: 需要置顶显示
   - What's unclear: 同组内排序规则（按收藏时间？按名称？）
   - Recommendation: 按收藏时间倒序，最近收藏的在前

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified)

本阶段为纯代码变更，无外部工具、服务、运行时依赖。所有需要的包（Zustand、cmdk、Lucide）已在项目中安装。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test:unit -- --run tests/unit/stores/uiStore.test.ts tests/unit/hooks/useCommandPalette.test.ts` |
| Full suite command | `npm run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-02 | 主题切换状态持久化 | unit | `npm run test:unit -- --run tests/unit/stores/uiStore.test.ts` | ✅ 需扩展 |
| LAYOUT-02 | 主题切换无闪烁 | unit | 测试 hydration 行为 | ❌ Wave 0 |
| LAYOUT-04 | 命令面板打开/关闭 | unit | `npm run test:unit -- --run tests/unit/hooks/useCommandPalette.test.ts` | ✅ 已存在 |
| LAYOUT-04 | 最近访问记录 | unit | 测试新增功能 | ❌ Wave 0 |
| LAYOUT-04 | 收藏项目功能 | unit | 测试新增功能 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit -- --run`
- **Per wave merge:** `npm run test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/stores/uiStore.test.ts` — 扩展测试 theme 状态、setTheme、toggleTheme
- [ ] `tests/unit/hooks/useCommandPalette.test.ts` — 扩展测试最近访问、收藏功能
- [ ] `tests/unit/hooks/useTheme.test.ts` — 新建，测试主题应用逻辑（DOM class 切换）
- [ ] `tests/unit/components/ui/command-palette.test.tsx` — 新建，测试分组渲染、快捷键

*(现有测试基础设施完善，只需扩展测试用例覆盖新功能)*

## Sources

### Primary (HIGH confidence)
- src/stores/uiStore.ts — 已验证 persist 模式实现
- src/components/ui/command-palette.tsx — 已验证命令面板实现
- src/hooks/useCommandPalette.ts — 已验证 hook 实现
- src/app/globals.css — 已验证 CSS 变量定义
- tests/unit/stores/uiStore.test.ts — 已验证测试模式
- tests/unit/hooks/useCommandPalette.test.ts — 已验证测试模式

### Secondary (MEDIUM confidence)
- Zustand 文档 — persist 中间件用法
- cmdk 文档 — Command.Group 用法

### Tertiary (LOW confidence)
- 无

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 项目已有成熟实现，仅扩展
- Architecture: HIGH — 已验证现有模式可行
- Pitfalls: HIGH — 基于 Phase 1 经验和 React 最佳实践

**Research date:** 2026-03-26
**Valid until:** 30 天（稳定技术栈）