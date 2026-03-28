# Architecture

**Analysis Date:** 2026-03-25

## Pattern Overview

**Overall:** Next.js App Router with Feature-Driven Architecture

**Key Characteristics:**
- Server-side rendering (SSR) with React Server Components
- API routes co-located within the app directory (`src/app/api/v1/`)
- Global state management via Zustand stores
- Client-side data fetching via TanStack Query
- JWT-based authentication with middleware protection
- Focalboard-inspired Block architecture for flexible data modeling

## Layers

**Presentation Layer:**
- Purpose: UI components and page composition
- Location: `src/components/`, `src/app/`
- Contains: Reusable UI components, layout components, page components
- Depends on: Zustand stores, hooks, types
- Used by: End users via browser

**Domain/Block Layer:**
- Purpose: Core business abstractions
- Location: `src/blocks/`, `src/properties/`
- Contains: `Board`, `Card`, `View` block types, property system, filter logic
- Depends on: Base types from `src/types/`
- Used by: Components, stores, services

**State Management Layer:**
- Purpose: Client-side state orchestration
- Location: `src/stores/`
- Contains: `boardStore.ts` (310 lines), `historyStore.ts` (167 lines), `authStore.ts`, `uiStore.ts`
- Depends on: Zustand, block types
- Used by: UI components, hooks

**API Layer:**
- Purpose: HTTP request/response handling
- Location: `src/lib/api/`, `src/app/api/v1/`
- Contains: API client (`client.ts`), response helpers (`response.ts`), route handlers
- Depends on: Prisma, authentication middleware
- Used by: Frontend components, external clients

**Data Access Layer:**
- Purpose: Database operations
- Location: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma schema (32KB), 40+ models, seed scripts
- Depends on: PostgreSQL
- Used by: API route handlers, services

**Services Layer:**
- Purpose: Business logic encapsulation
- Location: `src/lib/services/`
- Contains: `ai-review.ts`, `issue-service.ts`, `report-generator.ts`
- Depends on: Prisma client, external APIs
- Used by: API route handlers

## Data Flow

**Authentication Flow:**
1. User submits credentials to `/api/v1/auth/login`
2. Server validates, generates JWT token
3. Token stored client-side (localStorage + cookie)
4. Middleware (`src/middleware.ts`) intercepts `/api/v1/*` requests
5. JWT verified, user info injected into request cookies
6. Route handlers access user context from cookies

**Kanban Board Data Flow:**
1. Page component fetches tasks via API client (`src/lib/api/client.ts`)
2. Data loaded into Zustand store (`boardStore.ts`)
3. Components subscribe to store via `useBoardStore()`
4. Drag-and-drop handled by `@dnd-kit` in `KanbanBoard.tsx`
5. Drop events trigger `onCardDrop` callback
6. API update followed by store mutation
7. History store tracks changes for undo/redo

**Block Model Flow:**
1. Database entities mapped to Block types (`Board`, `Card`, `View`)
2. Blocks have unified fields: `id`, `workspaceId`, `createAt`, `updateAt`, `deletedAt`
3. Properties stored as JSON, accessed via typed getters
4. Views define filtering, sorting, grouping configurations

## Key Abstractions

**Block System (`src/blocks/types.ts`):**
- Purpose: Unified data model for boards, cards, and views
- Examples: `Board`, `Card`, `View` interfaces
- Pattern: Discriminated unions with `type` field

**Property System (`src/properties/types.ts`):**
- Purpose: Flexible field definitions (text, select, date, person, etc.)
- Examples: 16 property types including `select`, `multiPerson`, `createdTime`
- Pattern: Schema-on-read with runtime type guards

**Filter System (`src/blocks/filter.ts`):**
- Purpose: Dynamic data filtering and grouping
- Location: `src/blocks/filter.ts` (3438 lines)
- Pattern: Nested filter groups with AND/OR logic

**State Stores (`src/stores/`):**
- Purpose: Centralized client state with persistence
- Examples: `useBoardStore`, `useHistoryStore`
- Pattern: Zustand with `persist` middleware

**API Response Pattern (`src/lib/api/response.ts`):**
- Purpose: Consistent API response format
- Pattern: `{ success: boolean, data?: T, error?: ApiError }`

## Entry Points

**Application Root:**
- Location: `src/app/layout.tsx`
- Purpose: Root layout with providers (QueryClient, Auth, CommandPalette)
- Triggers: Every page load

**Main Layout:**
- Location: `src/app/(main)/layout.tsx` → `src/components/layout/AppLayout.tsx`
- Purpose: Authenticated user shell with sidebar and header
- Triggers: All authenticated pages

**API Routes:**
- Location: `src/app/api/v1/[resource]/route.ts`
- Entry functions: `export async function GET/POST/PUT/DELETE(req: NextRequest)`
- Protected by: `src/middleware.ts` JWT verification

**Auth Pages:**
- Location: `src/app/(auth)/`
- Pages: `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
- Public access (no auth required)

**Feature Pages:**
- Location: `src/app/(main)/`, `src/app/projects/`, `src/app/tasks/`
- Examples: `dashboard/page.tsx`, `projects/[id]/page.tsx`, `tasks/page.tsx`
- Protected by: Auth layout wrapper

## Error Handling

**Strategy:** Typed error responses with centralized error classes

**Patterns:**
- API errors: `ApiError` class in `src/lib/api/client.ts` with `code`, `status`, `message`
- Response helpers: `ApiResponder` in `src/lib/api/response.ts` with typed methods
- Client handling: `success`/`error` discrimination in API responses
- Boundary: `ErrorBoundary.tsx` component for React error boundaries

## Cross-Cutting Concerns

**Logging:** Console-based logging with structured output; audit logs stored in `audit_logs` table

**Validation:** Zod schemas for runtime validation (see `zod` in dependencies)

**Authentication:** JWT via `jose` library; middleware enforcement in `src/middleware.ts`

**Authorization:** Role-based checks (`requireAdmin` helper in middleware)

**Rate Limiting:** `src/lib/rate-limiter.ts` (3025 lines) for API protection

**Caching:** React Query cache + `src/lib/cache.ts` for server-side caching

**AI Integration:** `src/lib/ai.ts` (7880 lines) with provider abstraction, response caching, usage logging

---

*Architecture analysis: 2026-03-25*
