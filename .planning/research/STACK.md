# Technology Stack

**Project:** Project Manager - UI Modernization
**Researched:** 2026-03-25

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Full-stack React framework | Already in use, App Router provides excellent server component support, turbopack for fast dev builds |
| React | 18.3.x | UI framework | Stable, compatible with Next.js 15, Server Components ready |
| TypeScript | 5.9.x | Type safety | Already configured, excellent Next.js integration |

### UI Components
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **shadcn/ui** | latest (2025) | Component library | Copy-paste components = full control, built on Radix UI (already in use), Tailwind CSS native |
| **Radix UI** | latest primitives | Headless component base | Already in package.json (`@radix-ui/react-*`), accessible, unstyled = perfect for shadcn/ui |
| **Tailwind CSS** | 4.1.x | Utility-first CSS | Already upgraded to v4, shadcn/ui uses Tailwind utilities, `tailwind-merge` for class composition |
| **Lucide React** | 0.468.x | Icon library | Already in use, consistent icon set, tree-shakeable |
| **Framer Motion** | 12.38.x | Animations | Already in use, smooth transitions for sidebar/collapsible panels |

### State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Zustand** | 5.0.x | Client state | Already in use, v5 has improved API, simpler than Redux, perfect for UI state (sidebar, theme) |
| **TanStack Query** | 5.62.x | Server state | Already in use, handles caching/mutations, pairs well with Zustand |

### Data Visualization
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Recharts** | 2.15.x | Charts (dashboard) | Already in use, sufficient for dashboard metrics |
| **Custom SVG Gantt** | — | Gantt/Timeline view | Recharts doesn't support Gantt charts, custom SVG maintains design consistency with Tailwind |

### Drag & Drop
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@dnd-kit** | 6.3.x | Kanban board, sortable lists | Already in use, modern API, better than react-dnd, accessible |

### Forms & Validation
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React Hook Form** | 7.54.x | Form management | Already in use, excellent performance, shadcn/ui form components use it |
| **Zod** | 4.3.x | Schema validation | Already in use, shadcn/ui form components expect Zod schemas |

### Tables
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Table** | 8.21.x | Data tables | Already in use (`data-table.tsx`), headless = style freedom, sorting/filtering built-in |

### Command Palette
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **cmdk** | 1.1.x | Command palette (⌘K) | Already in use, shadcn/ui uses cmdk internally, keyboard-first navigation |

### Date/Time
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React Day Picker** | 9.13.x | Date picker | Already in use, modern API, shadcn/ui calendar component uses it |
| **date-fns** | 3.6.x | Date utilities | Already in use, lightweight, functional API |

## shadcn/ui Integration Strategy

### Current State Analysis
Your project **already has shadcn/ui components** implemented:
- `src/components/ui/button.tsx` - shadcn/ui button pattern
- `src/components/ui/dialog.tsx`, `popover.tsx`, `select.tsx`, `tabs.tsx`
- `src/components/ui/command.tsx`, `command-palette.tsx` - cmdk-based
- `src/components/ui/data-table.tsx` - TanStack Table wrapper
- `src/components/ui/card.tsx`, `badge.tsx`, `input.tsx`, `label.tsx`
- `src/components/ui/tooltip.tsx`, `avatar.tsx`, `checkbox.tsx`, `switch.tsx`
- `src/components/ui/calendar.tsx` - React Day Picker wrapper
- `src/components/ui/skeleton.tsx` - Loading states
- `src/components/ui/breadcrumb.tsx`, `textarea.tsx`, `combobox.tsx`

### What's Missing (Recommended Additions)

| Component | Purpose | Priority |
|-----------|---------|----------|
| **Sheet** | Slide-out panels (mobile nav, filters) | HIGH - needed for collapsible sidebar |
| **Drawer** | Mobile-friendly dialogs | HIGH - mobile UX |
| **Sonner** | Toast notifications | HIGH - replacement for custom toasts |
| **Hover Card** | Quick previews (user info, task details) | MEDIUM - Plane-style UX |
| **Navigation Menu** | Top nav patterns | MEDIUM |
| **Collapsible** | Tree views, nested sections | MEDIUM - for requirement/risk trees |
| **Separator** | Visual dividers | LOW - trivial |
| **Scroll Area** | Custom scrollbars | LOW - aesthetic |
| **Resizable** | Split panels (editor layouts) | MEDIUM - for document preview |
| **Pagination** | Table pagination controls | MEDIUM |
| **Progress** | Progress bars | LOW - already have RiskProgress |
| **Slider** | Range inputs | LOW - situational |
| **Alert/Alert Dialog** | Warning banners | MEDIUM - for review status banners |
| **Aspect Ratio** | Media containers | LOW |
| **Carousel** | Image galleries | LOW - file management |

### Integration Steps

```bash
# 1. Ensure shadcn/ui CLI is available (if using CLI for new components)
npx shadcn@latest init

# 2. Add missing components one at a time
npx shadcn@latest add sheet
npx shadcn@latest add drawer
npx shadcn@latest add sonner
npx shadcn@latest add hover-card
npx shadcn@latest add collapsible
npx shadcn@latest add resizable
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
npx shadcn@latest add pagination

# 3. For Tailwind CSS v4 compatibility, verify your globals.css
# shadcn/ui v2025 uses CSS variables for theming
```

### Theme System (Dark/Light Mode)

```typescript
// Already using shadcn/ui pattern - extend for theme toggle
// src/components/ui/theme-toggle.tsx (create)

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes" // or custom hook

// Use next-themes or custom Zustand store for theme state
```

**Recommendation:** Use a custom Zustand store (you already have Zustand 5) instead of `next-themes` to avoid extra dependency:

```typescript
// src/stores/theme-store.ts
import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => {
    // Handle system preference detection
    set({ theme })
  },
}))
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Components | shadcn/ui | Mantine, Chakra UI | shadcn/ui = full control, no runtime dependency, matches existing Radix UI usage |
| Components | shadcn/ui | Ant Design | AntD = heavy bundle, opinionated styles, doesn't match Plane/Linear aesthetic |
| Charts | Recharts | VisX | VisX = lower level, more complex. Recharts sufficient for dashboard needs |
| Charts | Recharts + Custom SVG | D3.js | D3 = steep learning curve, overkill for simple metrics |
| Gantt | Custom SVG | dhtmlxGantt | dhtmlx = commercial license, heavy. Custom = full control, matches design |
| Gantt | Custom SVG | react-gantt-timeline | Limited customization, doesn't support complex dependencies |
| Tables | TanStack Table | AG Grid | AG Grid = heavy, enterprise features not needed. TanStack = headless, lightweight |
| Forms | React Hook Form | Formik | Formik = slower, more re-renders. RHF = better performance |
| Drag-drop | @dnd-kit | react-beautiful-dnd | react-beautiful-dnd = less maintained, @dnd-kit = more flexible, accessible |
| State | Zustand | Redux Toolkit | Zustand = simpler API, less boilerplate, perfect for this scale |
| Theme | Custom Zustand | next-themes | next-themes = extra dependency, Zustand already in use |

## Installation

```bash
# Core shadcn/ui components to add
npx shadcn@latest add sheet drawer sonner hover-card collapsible alert alert-dialog pagination resizable

# If not already configured (verify tailwind.config.ts has CSS variables)
# Check that globals.css has:
# :root { --background: 0 0% 100%; --foreground: 222.2 84% 4.9%; ... }
# .dark { --background: 222.2 84% 4.9%; --foreground: 210 40% 98%; ... }

# Dev dependencies (if needed)
npm install -D @types/node
```

## Tailwind CSS v4 Compatibility Notes

Your project uses **Tailwind CSS 4.1.14** - this is current and correct.

**Key v4 changes that affect shadcn/ui:**
1. **No `tailwind.config.js` required** - v4 uses CSS-first configuration
2. **`@theme` directive** - Define custom values in CSS
3. **OKLCH colors** - Modern color space (optional)

**Your current setup is compatible because:**
- `tailwind.config.ts` exists (v4 supports legacy config)
- Using `@tailwindcss/postcss` plugin (correct for v4)
- shadcn/ui v2025 supports both v3 and v4 patterns

**If migrating config to CSS:**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #000;
  --color-primary-foreground: #fff;
  /* ... other design tokens */
}
```

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| shadcn/ui recommendation | HIGH | Project already uses shadcn/ui patterns, Radix UI primitives in place |
| Tailwind CSS v4 | HIGH | Already upgraded, verified in package.json |
| Zustand 5 | HIGH | Already in use, v5 is stable |
| Gantt chart approach | MEDIUM | Custom SVG is recommended pattern, but requires implementation |
| Component additions | HIGH | Based on shadcn/ui official component list and Plane/Linear patterns |

## Sources

- shadcn/ui documentation (via WebSearch verification)
- Tailwind CSS v4 release notes
- Zustand 5.0 release announcements
- @dnd-kit documentation
- TanStack Table v8 documentation
- Project package.json analysis (existing dependencies)
- Project component analysis (existing UI components)
