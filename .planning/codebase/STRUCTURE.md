# Directory Structure

**Analysis Date:** 2026-03-25

## Overview

```
project-manager/
├── src/                    # Application source code
│   ├── app/                # Next.js App Router pages and API routes
│   ├── components/         # React components (reusable + feature-specific)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core libraries and utilities
│   ├── stores/             # Zustand state stores
│   ├── blocks/             # Focalboard-style block types and logic
│   ├── properties/         # Property system types
│   ├── types/              # Shared TypeScript types
│   ├── styles/             # Global styles
│   ├── middleware.ts       # Next.js middleware (auth, routing)
│   └── __tests__/          # Source-level tests
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma schema (40+ models)
│   └── migrations/         # Database migration files
├── tests/                  # E2E and integration tests
│   ├── e2e/                # Playwright E2E tests
│   ├── integration/        # Integration tests
│   ├── unit/               # Unit tests
│   └── setup.ts            # Test configuration
├── public/                 # Static assets
├── uploads/                # User-uploaded files
├── .planning/              # Project planning documents
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── .github/                # GitHub workflows and templates
```

## Directory Purposes

**`src/app/` - Pages and Routes:**
- Purpose: Next.js App Router file-based routing
- Contains: Route groups, page components, API routes
- Key files:
  - `src/app/layout.tsx` - Root layout with providers
  - `src/app/page.tsx` - Home page redirect
  - `src/app/(main)/layout.tsx` - Authenticated layout wrapper
  - `src/app/(auth)/` - Public auth pages
  - `src/app/api/v1/` - REST API endpoints (25+ route groups)

**`src/components/` - UI Components:**
- Purpose: Reusable and feature-specific React components
- Contains:
  - `ui/` - shadcn/ui base components (button, dialog, table, etc.)
  - `kanban/` - Kanban board components (`KanbanBoard.tsx`, `KanbanCard.tsx`)
  - `layout/` - `AppLayout.tsx`, `Header.tsx`, `Sidebar.tsx`
  - `tasks/`, `issues/`, `risks/` - Domain-specific components
  - `reviews/`, `dashboard/`, `files/` - Feature modules
- Key files: `src/components/ui/command-palette.tsx`, `src/components/layout/AppLayout.tsx`

**`src/lib/` - Core Libraries:**
- Purpose: Shared utilities and service modules
- Contains:
  - `api/` - `client.ts` (API client), `response.ts` (response helpers)
  - `services/` - `ai-review.ts`, `issue-service.ts`, `report-generator.ts`
  - `ai.ts` - AI integration (7880 lines, multi-provider support)
  - `cache.ts`, `rate-limiter.ts`, `email.ts`, `notification.ts`
  - `queryClient.ts` - TanStack Query configuration
  - `utils.ts` - `cn()` helper for Tailwind classes

**`src/stores/` - State Management:**
- Purpose: Zustand stores for global client state
- Contains:
  - `boardStore.ts` (310 lines) - Kanban board state
  - `historyStore.ts` (167 lines) - Undo/redo functionality
  - `authStore.ts` - Authentication state
  - `uiStore.ts` - UI preferences

**`src/hooks/` - Custom Hooks:**
- Purpose: Reusable React hooks
- Contains:
  - `useAuth.tsx` - Authentication context and hooks
  - `use-toast.ts` - Toast notifications
  - `useBreadcrumbs.ts`, `useCommandPalette.ts`, `useDragAndDrop.ts`
  - `useKanbanDragDrop.ts` - Kanban-specific drag-drop logic
  - `useTags.ts` - Tag management

**`src/blocks/` - Block Architecture:**
- Purpose: Focalboard-inspired data model
- Contains:
  - `types.ts` - `Board`, `Card`, `View` type definitions
  - `filter.ts` - Filtering and sorting logic

**`prisma/` - Database:**
- Purpose: Database schema and ORM configuration
- Contains:
  - `schema.prisma` - 40+ models (users, projects, tasks, issues, reviews, etc.)
  - `migrations/` - Versioned schema changes
  - `seed.ts` - Database seeding

**`tests/` - Test Suites:**
- Purpose: Comprehensive test coverage
- Contains:
  - `e2e/` - Playwright browser tests
  - `integration/` - API integration tests
  - `unit/` - Unit tests for modules
  - `setup.ts` - Vitest/JSDOM configuration

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout with QueryClient, AuthProvider, CommandPalette
- `src/app/page.tsx`: Home page (redirects to dashboard)
- `src/app/(main)/layout.tsx`: Authenticated layout wrapper
- `src/middleware.ts`: JWT authentication middleware for API routes

**Configuration:**
- `next.config.ts`: Next.js configuration
- `tsconfig.json`: TypeScript paths (`@/*` → `src/*`)
- `vitest.config.ts`: Unit test configuration
- `playwright.config.ts`: E2E test configuration
- `prisma/schema.prisma`: Database schema

**Core Logic:**
- `src/lib/api/client.ts`: API client with error handling
- `src/lib/api/response.ts`: API response helpers
- `src/stores/boardStore.ts`: Kanban board state
- `src/blocks/types.ts`: Block type definitions

**Testing:**
- `tests/setup.ts`: Test environment setup
- `vitest.config.ts`: Vitest configuration
- `playwright.config.ts`: Playwright configuration

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `KanbanBoard.tsx`, `AppLayout.tsx`)
- Utilities: camelCase (e.g., `useAuth.tsx`, `queryClient.ts`)
- Types: `types.ts` or `[domain].ts` in `types/` directory
- Tests: `[name].test.tsx` or `[name].spec.ts` co-located with source

**Directories:**
- Routes: kebab-case or bracket notation for dynamic routes (e.g., `[id]/`)
- Components: Feature-based grouping (e.g., `kanban/`, `tasks/`)
- Route groups: Parentheses notation (e.g., `(main)/`, `(auth)/`)

**Exports:**
- Named exports for components: `export function ComponentName()`
- Default exports for pages: `export default function Page()`
- Type exports: `export interface TypeName`

## Where to Add New Code

**New Feature Page:**
- Page component: `src/app/(main)/[feature]/page.tsx`
- API routes: `src/app/api/v1/[feature]/route.ts`
- Components: `src/components/[feature]/`
- Store (if needed): `src/stores/[feature]Store.ts`

**New API Endpoint:**
- Single resource: `src/app/api/v1/[resource]/route.ts`
- Resource by ID: `src/app/api/v1/[resource]/[id]/route.ts`
- Follow pattern: Export `GET`, `POST`, `PUT`, `DELETE` as needed

**New Component:**
- Reusable UI: `src/components/ui/[component].tsx`
- Feature-specific: `src/components/[feature]/[Component].tsx`
- Add types: `src/components/[feature]/types.ts` if complex

**New Utility/Hook:**
- Hook: `src/hooks/use[Feature].ts`
- Utility: `src/lib/[utility].ts`
- Service: `src/lib/services/[service].ts`

**New Database Model:**
- Add model to: `prisma/schema.prisma`
- Generate: `npm run db:generate`
- Migrate: `npm run db:migrate`

## Special Directories

**`(main)/` - Route Group:**
- Purpose: Authenticated pages sharing the main layout
- Contains: `dashboard/`, `settings/`, `admin/`, `reviews/`, `risks/`
- Generated: No
- Committed: Yes

**`(auth)/` - Route Group:**
- Purpose: Public authentication pages
- Contains: `login/`, `register/`, `forgot-password/`, `reset-password/`
- Layout: `src/app/(auth)/layout.tsx`

**`api/v1/` - API Routes:**
- Purpose: RESTful API endpoints
- Structure: `/api/v1/[resource]/[action]/route.ts`
- Protected: Yes, via middleware (except login, register)

**`.planning/` - Planning Documents:**
- Purpose: Project documentation and analysis
- Contains: `codebase/ARCHITECTURE.md`, `codebase/STRUCTURE.md`
- Generated: Yes, by GSD tooling
- Committed: Yes

**`uploads/` - User Files:**
- Purpose: User-uploaded file storage
- Contains: Documents, images, project files
- Generated: Yes, at runtime
- Committed: No (in `.gitignore`)

**`.next/` - Build Output:**
- Purpose: Next.js build artifacts
- Generated: Yes, by `npm run build`
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-03-25*
