# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**
- TypeScript 5.9.3 - Primary application language for both frontend and backend

**Secondary:**
- SQL (via Prisma ORM) - Database queries and schema definition

## Runtime

**Environment:**
- Node.js >=20.0.0 (specified in `package.json` engines)
- Next.js 15.1.0 runtime (React Server Components + App Router)

**Package Manager:**
- npm (inferred from lockfile patterns)
- Lockfile: Present (package-lock.json)

## Frameworks

**Core:**
- Next.js 15.1.0 - Full-stack React framework with App Router (`next.config.ts`)
- React 18.3.1 - UI component framework
- React Server Components - Server-side rendering and data fetching

**State Management:**
- Zustand 5.0.2 - Client-side state management (`src/stores/`)
- TanStack Query 5.62.0 - Server state management and data fetching (`@tanstack/react-query`)

**UI/Styling:**
- Tailwind CSS 4.1.14 - Utility-first CSS framework (`tailwind.config.ts`)
- Radix UI - Headless component primitives (`@radix-ui/*`)
- Lucide React 0.468.0 - Icon library
- Framer Motion 12.38.0 - Animation library

**Testing:**
- Vitest 3.2.4 - Unit and component test runner (`vitest.config.ts`)
- Playwright 1.58.2 - End-to-end browser testing (`playwright.config.ts`)
- Testing Library 16.3.2 - Component testing utilities

**Build/Dev:**
- Turbopack - Development bundler (`npm run dev --turbopack`)
- TypeScript 5.9.3 - Type checking
- ESLint 9.18.0 - Linting (`eslint.config.mjs`)
- Prettier 3.4.2 - Code formatting

## Key Dependencies

**Critical:**
- Prisma 6.1.0 - Database ORM and schema management (`prisma/schema.prisma`)
- Zod 4.3.6 - Runtime type validation and schema parsing
- Jose 5.9.6 - JWT token handling for authentication
- React Hook Form 7.54.0 - Form management

**Infrastructure:**
- Nodemailer 8.0.1 - Email sending (`src/lib/email.ts`)
- PDFKit 0.17.2 - PDF document generation
- Docx 9.6.0 - Word document generation
- TanStack Table 8.21.3 - Data table components

**UI Components:**
- @dnd-kit/core 6.3.1 - Drag and drop functionality
- cmdk 1.1.1 - Command palette component
- React Day Picker 9.13.2 - Date picker
- Recharts 2.15.0 - Data visualization charts

## Configuration

**Environment:**
- `.env` - Runtime configuration (database URL, secrets, feature flags)
- `.env.example` - Template for required environment variables
- `.env.test` - Test-specific configuration
- Key required vars: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_URL`

**Build:**
- `next.config.ts` - Next.js configuration (turbopack rules, security headers)
- `tsconfig.json` - TypeScript configuration with path alias `@/*` → `src/*`
- `tailwind.config.ts` - Tailwind CSS theme customization
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin
- `vitest.config.ts` - Vitest test runner configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `eslint.config.mjs` - Flat ESLint configuration

## Platform Requirements

**Development:**
- Node.js >=20.0.0
- Docker (for PostgreSQL and OnlyOffice services via `docker-compose.yml`)
- PostgreSQL 15 (via Docker or local installation)

**Production:**
- Docker deployment supported (`docker-compose.yml` with app and postgres services)
- PostgreSQL 15 database
- Node.js 20+ runtime environment

## Database

**ORM:**
- Prisma 6.1.0 (`prisma/schema.prisma`)
- Binary targets: native, linux-musl-openssl, debian-openssl

**Schema:**
- 30+ models including users, projects, tasks, requirements, reviews, risks
- Extensive enum types for status, roles, priorities
- Relational data with cascading deletes

---

*Stack analysis: 2026-03-25*
