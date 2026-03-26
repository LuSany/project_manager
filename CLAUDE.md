# 项目规范

---

## 思考要求

- 使用中文进行交流、回答问题、维护md文档
- 请用分点加小标题的结构输出答案
- 请在每个结论后标注数据来源或推理依据
- 请用我能直接执行的步骤来呈现方案
- 每完成一个功能开发或测试或修复，及时总结改动点提交本地commit

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Project Manager - UI 现代化与功能增强**

项目管理器系统是一个企业级项目管理平台，支持任务管理、需求管理、风险管理、评审流程等核心功能。本次里程碑目标是参考 Plane、Vikunja、Focalboard、AppFlowy 等优秀开源项目，重新设计现代化 UI，并新增设备/机时管理、AI 智能分析等功能。

**Core Value:** **打造现代化、智能化的项目管理体验** —— 让用户高效管理项目、设备资源，并借助 AI 能力提升决策质量。

### Constraints

- **技术栈**: 保持 Next.js + TypeScript + Prisma，不更换框架
- **兼容性**: 新 UI 需兼容现有 API
- **性能**: 首屏加载 < 3s，交互响应 < 100ms
- **浏览器**: 支持 Chrome、Firefox、Safari 最新两个版本
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Primary application language for both frontend and backend
- SQL (via Prisma ORM) - Database queries and schema definition
## Runtime
- Node.js >=20.0.0 (specified in `package.json` engines)
- Next.js 15.1.0 runtime (React Server Components + App Router)
- npm (inferred from lockfile patterns)
- Lockfile: Present (package-lock.json)
## Frameworks
- Next.js 15.1.0 - Full-stack React framework with App Router (`next.config.ts`)
- React 18.3.1 - UI component framework
- React Server Components - Server-side rendering and data fetching
- Zustand 5.0.2 - Client-side state management (`src/stores/`)
- TanStack Query 5.62.0 - Server state management and data fetching (`@tanstack/react-query`)
- Tailwind CSS 4.1.14 - Utility-first CSS framework (`tailwind.config.ts`)
- Radix UI - Headless component primitives (`@radix-ui/*`)
- Lucide React 0.468.0 - Icon library
- Framer Motion 12.38.0 - Animation library
- Vitest 3.2.4 - Unit and component test runner (`vitest.config.ts`)
- Playwright 1.58.2 - End-to-end browser testing (`playwright.config.ts`)
- Testing Library 16.3.2 - Component testing utilities
- Turbopack - Development bundler (`npm run dev --turbopack`)
- TypeScript 5.9.3 - Type checking
- ESLint 9.18.0 - Linting (`eslint.config.mjs`)
- Prettier 3.4.2 - Code formatting
## Key Dependencies
- Prisma 6.1.0 - Database ORM and schema management (`prisma/schema.prisma`)
- Zod 4.3.6 - Runtime type validation and schema parsing
- Jose 5.9.6 - JWT token handling for authentication
- React Hook Form 7.54.0 - Form management
- Nodemailer 8.0.1 - Email sending (`src/lib/email.ts`)
- PDFKit 0.17.2 - PDF document generation
- Docx 9.6.0 - Word document generation
- TanStack Table 8.21.3 - Data table components
- @dnd-kit/core 6.3.1 - Drag and drop functionality
- cmdk 1.1.1 - Command palette component
- React Day Picker 9.13.2 - Date picker
- Recharts 2.15.0 - Data visualization charts
## Configuration
- `.env` - Runtime configuration (database URL, secrets, feature flags)
- `.env.example` - Template for required environment variables
- `.env.test` - Test-specific configuration
- Key required vars: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_URL`
- `next.config.ts` - Next.js configuration (turbopack rules, security headers)
- `tsconfig.json` - TypeScript configuration with path alias `@/*` → `src/*`
- `tailwind.config.ts` - Tailwind CSS theme customization
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin
- `vitest.config.ts` - Vitest test runner configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `eslint.config.mjs` - Flat ESLint configuration
## Platform Requirements
- Node.js >=20.0.0
- Docker (for PostgreSQL and OnlyOffice services via `docker-compose.yml`)
- PostgreSQL 15 (via Docker or local installation)
- Docker deployment supported (`docker-compose.yml` with app and postgres services)
- PostgreSQL 15 database
- Node.js 20+ runtime environment
## Database
- Prisma 6.1.0 (`prisma/schema.prisma`)
- Binary targets: native, linux-musl-openssl, debian-openssl
- 30+ models including users, projects, tasks, requirements, reviews, risks
- Extensive enum types for status, roles, priorities
- Relational data with cascading deletes
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## 命名模式
- React 组件：`PascalCase.tsx`，例如 `Button.tsx`, `TaskKanban.tsx`
- Hooks：`usePascalCase.ts`，例如 `useAuth.tsx`, `useTags.ts`
- 工具函数：`kebab-case.ts` 或 `camelCase.ts`，例如 `test-db.ts`, `mime-detector.ts`
- 类型定义：`kebab-case.ts` 或 `PascalCase.ts`，例如 `types.ts`, `issue.ts`
- 测试文件：`*.test.ts` 或 `*.test.tsx`，例如 `historyStore.test.ts`, `KanbanCard.test.tsx`
- 普通函数：`camelCase`，例如 `fetchUser`, `createTestUser`
- React 组件：`PascalCase`，例如 `AuthProvider`, `Button`
- 测试函数：`describe`, `it`, `expect` 使用 Vitest 标准
- 工厂函数：`createX`，例如 `userFactory.create()`, `projectFactory.create()`
- 普通变量：`camelCase`，例如 `userData`, `testUser`
- 常量：`UPPER_CASE` 用于真正的常量，例如 `DEFAULT_TIMEOUT`, `API_BASE`
- React hooks 状态：`camelCase`，例如 `user`, `loading`
- 类型接口：`PascalCase`，例如 `User`, `ApiResponse`
- UI 组件：`PascalCase`，例如 `Button`, `Dialog`, `Popover`
- 页面组件：`page.tsx` (Next.js 约定)
- 布局组件：`layout.tsx` (Next.js 约定)
## 代码风格
- 工具：Prettier (`prettier` v3.4.2)
- 配置文件：`.prettierrc`
- 配置：
- 工具：ESLint v9 + TypeScript ESLint
- 配置：`eslint.config.mjs`
- 扩展：`next/core-web-vitals`, `typescript-eslint/recommended`
- 关键规则：
- 严格模式：部分启用 (`strict: false`)
- 模块系统：`esnext`
- 模块解析：`bundler`
- JSX：`preserve`
- 路径别名：`@/*` → `./src/*`
## 导入组织
- `@/` → `./src/`
- 配置文件：`tsconfig.json`
## 错误处理
- 使用自定义 `ApiError` 类，包含 `status`, `code`, `message`, `data`
- 文件：`src/lib/api/client.ts`
- 模式：
- 使用 `try/catch/finally` 处理异步操作
- 在 `catch` 中返回统一的错误响应格式
- 在 `finally` 中清理资源（如清除定时器）
- 使用 Zod 进行运行时验证（依赖中有 `zod` v4.3.6）
- Hooks 中抛出带有描述性消息的 `Error`
## 状态管理
- 主要状态管理库 (`zustand` v5.0.2)
- 使用 `create` 函数创建 store
- 使用 `subscribeWithSelector` 中间件支持订阅
- 文件示例：`src/stores/historyStore.ts`
- 用于认证状态 (`AuthProvider`)
- 文件：`src/hooks/useAuth.tsx`
- 模式：
- 用于服务器状态缓存 (`@tanstack/react-query` v5.62.0)
- 与 Zustand 配合使用：Zustand 管理 UI 状态，React Query 管理 API 数据
## 组件模式
- 使用 `class-variance-authority` (cva) 定义变体
- 使用 `forwardRef` 支持 ref 转发
- 文件示例：`src/components/ui/button.tsx`
- `cn()` 函数用于合并类名 (`tailwind-merge` + `clsx`)
- 文件：`src/lib/utils.ts`
## 注释规范
- 在公共 API、复杂函数和类型定义上使用 JSDoc
- 中文注释
- 示例：
- 使用中文
- 解释"为什么"而非"是什么"
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Server-side rendering (SSR) with React Server Components
- API routes co-located within the app directory (`src/app/api/v1/`)
- Global state management via Zustand stores
- Client-side data fetching via TanStack Query
- JWT-based authentication with middleware protection
- Focalboard-inspired Block architecture for flexible data modeling
## Layers
- Purpose: UI components and page composition
- Location: `src/components/`, `src/app/`
- Contains: Reusable UI components, layout components, page components
- Depends on: Zustand stores, hooks, types
- Used by: End users via browser
- Purpose: Core business abstractions
- Location: `src/blocks/`, `src/properties/`
- Contains: `Board`, `Card`, `View` block types, property system, filter logic
- Depends on: Base types from `src/types/`
- Used by: Components, stores, services
- Purpose: Client-side state orchestration
- Location: `src/stores/`
- Contains: `boardStore.ts` (310 lines), `historyStore.ts` (167 lines), `authStore.ts`, `uiStore.ts`
- Depends on: Zustand, block types
- Used by: UI components, hooks
- Purpose: HTTP request/response handling
- Location: `src/lib/api/`, `src/app/api/v1/`
- Contains: API client (`client.ts`), response helpers (`response.ts`), route handlers
- Depends on: Prisma, authentication middleware
- Used by: Frontend components, external clients
- Purpose: Database operations
- Location: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma schema (32KB), 40+ models, seed scripts
- Depends on: PostgreSQL
- Used by: API route handlers, services
- Purpose: Business logic encapsulation
- Location: `src/lib/services/`
- Contains: `ai-review.ts`, `issue-service.ts`, `report-generator.ts`
- Depends on: Prisma client, external APIs
- Used by: API route handlers
## Data Flow
## Key Abstractions
- Purpose: Unified data model for boards, cards, and views
- Examples: `Board`, `Card`, `View` interfaces
- Pattern: Discriminated unions with `type` field
- Purpose: Flexible field definitions (text, select, date, person, etc.)
- Examples: 16 property types including `select`, `multiPerson`, `createdTime`
- Pattern: Schema-on-read with runtime type guards
- Purpose: Dynamic data filtering and grouping
- Location: `src/blocks/filter.ts` (3438 lines)
- Pattern: Nested filter groups with AND/OR logic
- Purpose: Centralized client state with persistence
- Examples: `useBoardStore`, `useHistoryStore`
- Pattern: Zustand with `persist` middleware
- Purpose: Consistent API response format
- Pattern: `{ success: boolean, data?: T, error?: ApiError }`
## Entry Points
- Location: `src/app/layout.tsx`
- Purpose: Root layout with providers (QueryClient, Auth, CommandPalette)
- Triggers: Every page load
- Location: `src/app/(main)/layout.tsx` → `src/components/layout/AppLayout.tsx`
- Purpose: Authenticated user shell with sidebar and header
- Triggers: All authenticated pages
- Location: `src/app/api/v1/[resource]/route.ts`
- Entry functions: `export async function GET/POST/PUT/DELETE(req: NextRequest)`
- Protected by: `src/middleware.ts` JWT verification
- Location: `src/app/(auth)/`
- Pages: `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
- Public access (no auth required)
- Location: `src/app/(main)/`, `src/app/projects/`, `src/app/tasks/`
- Examples: `dashboard/page.tsx`, `projects/[id]/page.tsx`, `tasks/page.tsx`
- Protected by: Auth layout wrapper
## Error Handling
- API errors: `ApiError` class in `src/lib/api/client.ts` with `code`, `status`, `message`
- Response helpers: `ApiResponder` in `src/lib/api/response.ts` with typed methods
- Client handling: `success`/`error` discrimination in API responses
- Boundary: `ErrorBoundary.tsx` component for React error boundaries
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
