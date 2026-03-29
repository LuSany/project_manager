# Phase 7: 管理后台 (Admin Backend) - Research

**Researched:** 2026-03-29
**Domain:** Admin Dashboard - User/Project/AI/Email/Template Management
**Confidence:** HIGH

## Summary

This phase enhances the existing admin backend with comprehensive CRUD operations, unified UI patterns using TanStack Table, and missing features like CSV import, bulk operations, AI connection testing, and template import/export. The existing admin pages use basic HTML tables and shadcn/ui dialogs but lack advanced filtering, sorting, and pagination. The research confirms that all required database models exist in Prisma schema and most API endpoints are partially implemented.

**Primary recommendation:** Migrate all admin tables to TanStack Table v8 for consistent UX, implement missing API endpoints (PUT/DELETE for AI/Email/Project, member management), add batch operations with row selection, and implement CSV import using PapaParse for user management.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 添加 CSV 导入用户功能，批量创建账户
- **D-02:** 支持选中多个用户批量修改状态（激活/禁用）
- **D-03:** 支持选中多个用户批量修改角色
- **D-04:** 扩展现有页面，在列表基础上添加创建、编辑对话框
- **D-05:** 添加成员管理面板，支持在列表中搜索选择用户添加
- **D-06:** 添加归档/取消归档功能
- **D-07:** 采用混合权限模式：角色级（RBAC）+ 资源级（Resource-based）组合
- **D-08:** RBAC 控制操作权限（创建/编辑/删除），资源级控制具体项目/任务访问
- **D-09:** 权限自动继承：项目成员自动拥有项目的任务访问权限
- **D-10:** 基于现有 Prisma 权限模型扩展
- **D-11:** 现有页面已完整，保持筛选和导出功能不变
- **D-12:** 添加"测试连接"功能，验证 API Key 有效性
- **D-13:** 支持创建、编辑、删除 AI 配置
- **D-14:** 多 Provider 支持：OpenAI、Anthropic、本地模型（如 Ollama）
- **D-15:** 模型选择需显示 provider 和 model 关联
- **D-19:** 完善 CRUD：添加编辑、删除邮件服务配置功能
- **D-20:** 邮件服务配置支持 SMTP 表单（host、port、user、password、fromAddress）
- **D-21:** 完善 CRUD：添加编辑、删除任务模板和评审模板
- **D-22:** 支持模板内容编辑和预览功能
- **D-23:** 添加项目设置页，包含 Webhook 配置、通知/集成设置、项目默认值配置
- **D-24:** 添加模板导入/导出功能，支持 JSON 格式
- **D-25:** 管理后台页面需适配暗色/浅色主题，确保所有自定义颜色使用 CSS 变量

### Claude's Discretion

- 具体的权限判断逻辑实现细节
- 测试连接的超时时间和错误提示文案
- 分页的默认每页数量和可选项
- CSV 导入的字段映射规则
- 批量操作的最大选中数量限制
- 邮件配置的连接测试逻辑
- 模板内容编辑的富文本/纯文本选择
- 项目设置页的具体 Tab 结构
- 模板导入/导出的文件格式规范
- 暗色主题下的颜色适配细节

### Deferred Ideas (OUT OF SCOPE)

None
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                               | Research Support                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADMIN-01 | User management interface with CRUD, role assignment, status toggle       | Existing users page has full CRUD dialogs, add TanStack Table with filtering/sorting/pagination, add CSV import (PapaParse), add bulk operations (status/role updates) |
| ADMIN-02 | Project management interface with CRUD, member management, archiving      | Existing projects page lacks create/edit dialogs, add member management using project_members table, add archive toggle (status field)                                 |
| ADMIN-03 | Permission configuration interface with fine-grained permissions          | Implement hybrid RBAC + Resource-based model, extend existing role field with permission system                                                                        |
| ADMIN-04 | Audit log interface with filtering                                        | Existing page complete with filters, keep unchanged                                                                                                                    |
| ADMIN-05 | AI configuration interface with API Key, model selection, test connection | Existing AI page has tabs but missing CRUD dialogs, add PUT/DELETE endpoints, add test connection API (similar to webhook test)                                        |

</phase_requirements>

## Standard Stack

### Core

| Library               | Version         | Purpose                                                           | Why Standard                                                                             |
| --------------------- | --------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| @tanstack/react-table | 8.21.3          | Headless table with filtering, sorting, pagination, row selection | Industry standard for React tables, already installed, supports complex admin operations |
| papaparse             | 5.5.3           | CSV parsing for user import                                       | Most popular CSV parser, handles header mapping, validation, error reporting             |
| openai                | Latest (verify) | OpenAI API integration for AI config testing                      | Official SDK, provides error handling for invalid keys                                   |
| @anthropic-ai/sdk     | 0.80.0          | Anthropic Claude API for multi-provider AI support                | Official SDK, provider-agnostic testing pattern                                          |

### Supporting

| Library         | Version | Purpose                                       | When to Use                                   |
| --------------- | ------- | --------------------------------------------- | --------------------------------------------- |
| shadcn/ui       | Current | Dialog, Select, Input, Badge, Tabs components | Already used in existing admin pages          |
| react-hook-form | 7.54.0  | Form validation for create/edit dialogs       | Existing dependency, better UX than raw forms |
| zod             | 4.3.6   | Schema validation for API requests            | Already used in API routes                    |

### Alternatives Considered

| Instead of           | Could Use                    | Tradeoff                                                                         |
| -------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| TanStack Table       | Material-React Table         | TanStack is more flexible with custom UI, Material-React is opinionated with MUI |
| PapaParse            | CSV-parse                    | PapaParse has better error handling and browser support                          |
| Individual SDK calls | Unified AI abstraction layer | Individual SDKs provide better error messages and provider-specific features     |

**Installation:**

```bash
npm install papaparse openai @anthropic-ai/sdk
# @tanstack/react-table and shadcn/ui already installed
```

**Version verification:**

- papaparse: 5.5.3 (verified 2026-03-29)
- @tanstack/react-table: 8.21.3 (verified 2026-03-29)
- @anthropic-ai/sdk: 0.80.0 (verified 2026-03-29 via npmjs.com)
- openai: Verify latest before implementation

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (main)/admin/
│   │   ├── users/
│   │   │   ├── page.tsx          # Main user management with TanStack Table
│   │   │   └── components/
│   │   │       ├── UserDialog.tsx       # Create/edit dialog
│   │   │       ├── CSVImportDialog.tsx  # CSV upload dialog
│   │   │       └── BulkActionsBar.tsx  # Bulk status/role operations
│   │   ├── projects/
│   │   │   ├── page.tsx          # Project list with TanStack Table
│   │   │   ├── [id]/
│   │   │   │   └── settings/page.tsx  # Project settings with tabs (webhooks, notifications, defaults)
│   │   │   └── components/
│   │   │       ├── ProjectDialog.tsx   # Create/edit dialog
│   │   │       └── MembersPanel.tsx    # Member management
│   │   ├── ai/
│   │   │   ├── page.tsx          # AI configs with tabs
│   │   │   └── components/
│   │   │       ├── AIConfigDialog.tsx  # Create/edit dialog
│   │   │       └── TestConnectionButton.tsx
│   │   ├── email/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── EmailConfigDialog.tsx
│   │   └── templates/
│   │       ├── page.tsx
│   │       └── components/
│   │           └── TemplateDialog.tsx
│   └── api/v1/admin/
│       ├── users/
│       │   ├── route.ts          # GET (list), POST (create), bulk operations
│       │   ├── [id]/route.ts     # PUT (edit), DELETE
│       │   ├── [id]/role/route.ts    # PATCH (bulk role update)
│       │   ├── [id]/status/route.ts  # PATCH (bulk status update)
│       │   └── import/route.ts   # POST (CSV import)
│       ├── projects/
│       │   ├── route.ts          # GET (list), POST (create)
│       │   ├── [id]/
│       │   │   ├── route.ts      # PUT (edit), DELETE (archive)
│       │   │   └── members/route.ts   # POST (add), DELETE (remove)
│       │   └── [id]/settings/
│       │       └── webhooks/route.ts   # Use existing webhook API
│       ├── ai/
│       │   ├── configs/
│       │   │   ├── route.ts      # GET, POST (existing), add PUT, DELETE
│       │   │   ├── [id]/route.ts # PUT, DELETE
│       │   │   └── test/route.ts # POST (test connection)
│       ├── email/
│       │   ├── configs/
│       │   │   ├── route.ts      # GET, POST (existing), add PUT, DELETE
│       │   │   ├── [id]/route.ts # PUT, DELETE
│       │   │   └── test/route.ts # POST (SMTP test)
│       │   └── templates/
│       │       ├── route.ts      # GET, POST (existing), add PUT, DELETE
│       │       ├── [id]/route.ts # PUT, DELETE
│       │       └── export/route.ts # GET (JSON export)
│       └── audit-logs/
│           └── route.ts          # GET (existing, keep unchanged)
```

### Pattern 1: TanStack Table with Filtering, Sorting, Pagination

**What:** Use @tanstack/react-table v8 headless table with client-side filtering, sorting, pagination, and row selection
**When to use:** All admin list views (users, projects, AI configs, email configs, templates)
**Example:**

```typescript
// Source: Context7 @tanstack/table documentation
import {
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  createColumnHelper,
  tableFeatures,
  useTable
} from '@tanstack/react-table'

const _features = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
})

const columnHelper = createColumnHelper<typeof _features, User>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    filterFn: 'includesString',
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    filterFn: 'includesString',
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    filterFn: 'equals',
  }),
])

function UsersTable({ users }: { users: User[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useTable({
    _features,
    columns,
    data: users,
    state: { sorting, columnFilters, pagination, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
  })

  const selectedUsers = table.getSelectedRowModel().rows.map(r => r.original)

  return (
    <div>
      {/* Bulk actions bar */}
      {selectedUsers.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button onClick={() => bulkUpdateStatus(selectedUsers, 'ACTIVE')}>
            Activate Selected ({selectedUsers.length})
          </Button>
          <Button onClick={() => bulkUpdateRole(selectedUsers, 'EMPLOYEE')}>
            Set Role
          </Button>
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <Button onClick={header.column.getToggleSortingHandler()}>
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                        </Button>
                      )}
                    </div>
                  )}
                  {header.column.getCanFilter() && (
                    <Input
                      value={header.column.getFilterValue() ?? ''}
                      onChange={e => header.column.setFilterValue(e.target.value)}
                      placeholder="Filter..."
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center gap-2 mt-4">
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <span>Page {pagination.pageIndex + 1} of {table.getPageCount()}</span>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
        <Select value={String(pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map(size => (
              <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

### Pattern 2: CSV Import with PapaParse

**What:** Client-side CSV parsing with validation and error reporting
**When to use:** User management bulk import
**Example:**

```typescript
// Source: Context7 PapaParse documentation
import Papa from 'papaparse'
import { z } from 'zod'

const userImportSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().optional(),
  role: z.enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE']),
})

function CSVImportDialog() {
  const [errors, setErrors] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseErrors: string[] = []
        const validData: any[] = []

        results.data.forEach((row: any, index: number) => {
          try {
            const validated = userImportSchema.parse(row)
            validData.push(validated)
          } catch (error) {
            if (error instanceof z.ZodError) {
              parseErrors.push(`Row ${index + 2}: ${error.issues[0].message}`)
            }
          }
        })

        setErrors(parseErrors)
        setPreviewData(validData.slice(0, 5)) // Show first 5 rows
      },
      error: (error) => {
        setErrors([`CSV parsing error: ${error.message}`])
      }
    })
  }

  const handleImport = async () => {
    // Send validData to API
    const response = await fetch('/api/v1/admin/users/import', {
      method: 'POST',
      body: JSON.stringify(previewData),
    })
  }

  return (
    <Dialog>
      <DialogContent>
        <Input type="file" accept=".csv" onChange={handleFileUpload} />
        {errors.length > 0 && (
          <div className="text-red-500">
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        )}
        <Button onClick={handleImport} disabled={previewData.length === 0}>
          Import {previewData.length} users
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 3: AI Connection Test

**What:** Provider-agnostic API key validation using minimal API call
**When to use:** AI config create/edit dialog before saving
**Example:**

```typescript
// OpenAI test
import OpenAI from 'openai'

async function testOpenAIConnection(apiKey: string, model: string) {
  const client = new OpenAI({ apiKey })
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    })
    return { success: true, model: response.model }
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      return { success: false, error: err.message, code: err.code }
    }
    return { success: false, error: 'Unknown error' }
  }
}

// Anthropic test
import Anthropic from '@anthropic-ai/sdk'

async function testAnthropicConnection(apiKey: string, model: string) {
  const client = new Anthropic({ apiKey })
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 5,
      messages: [{ role: 'user', content: 'test' }],
    })
    return { success: true, model: response.model }
  } catch (err: any) {
    return { success: false, error: err.message, code: err.status }
  }
}

// API route
// POST /api/v1/admin/ai/configs/test
export async function POST(req: NextRequest) {
  const { provider, apiKey, model, baseUrl } = await req.json()

  if (provider === 'OPENAI') {
    const result = await testOpenAIConnection(apiKey, model)
    return Response.json(result)
  } else if (provider === 'ANTHROPIC') {
    const result = await testAnthropicConnection(apiKey, model)
    return Response.json(result)
  } else if (provider === 'CUSTOM') {
    // Test with generic fetch request
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'test' }] }),
    })
    return Response.json({ success: response.ok, status: response.status })
  }
}
```

### Anti-Patterns to Avoid

- **Using hardcoded badge colors**: Use CSS variables for theme-aware colors (e.g., `bg-primary/10 text-primary` instead of `bg-green-100 text-green-800`)
- **Direct DOM manipulation**: Use TanStack Table's controlled state instead of manual DOM queries
- **Mixing validation approaches**: Stick to Zod for server-side validation, React Hook Form for client-side
- **Blocking the UI during long operations**: Use loading states and async patterns for CSV import and connection tests
- **Skipping error handling**: All API calls (especially AI tests) must have try/catch with user-friendly error messages

## Don't Hand-Roll

| Problem                 | Don't Build                                 | Use Instead                                     | Why                                                                    |
| ----------------------- | ------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| CSV parsing             | Custom file reader and string splitting     | papaparse                                       | Handles edge cases, quotes, encoding, provides detailed error messages |
| Table filtering/sorting | Manual array filtering and state management | TanStack Table                                  | Optimized performance, built-in pagination, consistent API             |
| Bulk operations         | Iterative API calls with Promise.all        | Batch API endpoints with Prisma bulk operations | Single transaction, atomic updates, better performance                 |
| Form validation         | Manual if/else checks                       | Zod + React Hook Form                           | Type-safe, reusable schemas, better UX                                 |
| AI SDK integration      | Fetch API with manual headers               | Official SDKs (openai, @anthropic-ai/sdk)       | Better error handling, typed responses, auto-retry                     |

**Key insight:** Custom table implementations quickly become unmaintainable. TanStack Table's headless approach allows full UI control while handling complex state management (sorting, filtering, pagination) efficiently.

## Runtime State Inventory

Not applicable (greenfield enhancement phase, not refactor/migration).

## Common Pitfalls

### Pitfall 1: TanStack Table v8 Breaking Changes

**What goes wrong:** Using v7 patterns (useTable hook directly) with v8 leads to errors
**Why it happens:** TanStack Table v8 requires explicit feature configuration (\_features, \_rowModels)
**How to avoid:** Always use the new feature-based API shown in examples. Reference the v8 migration guide if migrating existing code.
**Warning signs:** TypeScript errors about missing properties, hooks not working as expected

### Pitfall 2: PapaParse Memory Issues with Large Files

**What goes wrong:** Importing 10,000+ user CSV files crashes the browser
**Why it happens:** PapaParse loads entire file into memory
**How to avoid:** Use PapaParse's `worker` option or implement streaming. Add file size validation before parsing (<5MB recommended).
**Warning signs:** Browser becomes unresponsive, memory spikes

### Pitfall 3: AI Connection Tests Time Out

**What goes wrong:** Test connection button spins forever
**Why it happens:** OpenAI/Anthropic API calls without timeout, slow network
**How to avoid:** Implement AbortController with 10-second timeout (see webhook test pattern). Show loading state with cancel option.
**Warning signs:** No UI feedback after clicking test, button stays in loading state

### Pitfall 4: Permission Logic Gaps

**What goes wrong:** Users can access projects they shouldn't see
**Why it happens:** RBAC checks only at role level, not resource level
**How to avoid:** Implement resource-based checks in all API routes: check both user.role AND project_members table for access.
**Warning signs:** Users see projects they're not members of in API responses

### Pitfall 5: Hardcoded Theme Colors Break Dark Mode

**What goes wrong:** Badge colors like `bg-green-100 text-green-800` appear washed out in dark mode
**Why it happens:** Fixed background colors don't adapt to theme
**How to avoid:** Use semantic color classes (`bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400`) or Tailwind's dark mode variants.
**Warning signs:** Dark mode UI looks inconsistent, colors hard to read

## Code Examples

Verified patterns from official sources:

### Batch Update User Status

```typescript
// API route: PATCH /api/v1/admin/users/bulk/status
export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin(req)
  if (!admin) return error('FORBIDDEN', '无权限访问', undefined, 403)

  const { userIds, status } = await req.json()

  await prisma.users.updateMany({
    where: { id: { in: userIds } },
    data: { status, updatedAt: new Date() },
  })

  return success({ updatedCount: userIds.length })
}
```

### Add Project Member

```typescript
// API route: POST /api/v1/admin/projects/[id]/members
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin(req)
  if (!admin) return error('FORBIDDEN', '无权限访问', undefined, 403)

  const { id } = await params
  const { userId, role } = await req.json()

  await prisma.project_members.create({
    data: {
      projectId: id,
      userId,
      role: role as ProjectMemberRole,
    },
  })

  return success({})
}
```

### Template Export (JSON)

```typescript
// API route: GET /api/v1/admin/templates/export
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req)
  if (!admin) return error('FORBIDDEN', '无权限访问', undefined, 403)

  const templates = await prisma.task_templates.findMany({
    include: { createdBy: true },
  })

  return new Response(JSON.stringify(templates, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="templates.json"',
    },
  })
}
```

## State of the Art

| Old Approach               | Current Approach        | When Changed      | Impact                                                                      |
| -------------------------- | ----------------------- | ----------------- | --------------------------------------------------------------------------- |
| Basic HTML table           | TanStack Table v8       | 2023 (v8 release) | Client-side filtering/sorting/pagination, row selection, better performance |
| Manual CSV parsing         | PapaParse               | 2020+             | Reliable parsing, error handling, large file support                        |
| Server-side only rendering | React Server Components | Next.js 13+       | Better performance, reduced bundle size                                     |
| Hardcoded API calls        | Official SDKs           | 2024+             | Type safety, better error handling, auto-retry                              |

**Deprecated/outdated:**

- React Table v7 patterns (useTable hook without features)
- fetch API without AbortController for long requests
- Custom table pagination implementations
- Manual form validation (use Zod + React Hook Form)

## Open Questions

1. **Permission Check Implementation Depth**
   - What we know: Need hybrid RBAC + Resource-based model
   - What's unclear: Should permissions be checked at API route level, service layer, or both?
   - Recommendation: Implement at API route level using Prisma queries to project_members table. Add middleware for common patterns.

2. **CSV Import Duplicate Handling**
   - What we know: PapaParse can parse and validate CSV
   - What's unclear: How to handle duplicate emails? Skip, overwrite, or prompt user?
   - Recommendation: Check for duplicates before import, show preview with conflict warnings, let user choose (skip/overwrite).

3. **AI Config Model Selection**
   - What we know: Need to support multiple providers and models
   - What's unclear: How to fetch available models for each provider?
   - Recommendation: Use provider SDK to list models (OpenAI.models.list(), Anthropic doesn't expose model list), or hardcode common models in dropdown.

4. **Bulk Operation Limits**
   - What we know: Need bulk status/role updates for users
   - What's unclear: Maximum batch size to prevent API timeouts?
   - Recommendation: Implement chunking (max 100 users per request), show progress bar for large batches.

## Environment Availability

| Dependency            | Required By                   | Available | Version          | Fallback                                 |
| --------------------- | ----------------------------- | --------- | ---------------- | ---------------------------------------- |
| @tanstack/react-table | TanStack Table implementation | ✓         | 8.21.3           | —                                        |
| shadcn/ui components  | Dialog, Select, Input         | ✓         | Current (custom) | —                                        |
| Prisma 6.1.0          | Database queries              | ✓         | 6.1.0            | —                                        |
| papaparse             | CSV import                    | ✗         | —                | Install: `npm install papaparse`         |
| openai                | AI config testing             | ✗         | —                | Install: `npm install openai`            |
| @anthropic-ai/sdk     | Anthropic AI support          | ✗         | —                | Install: `npm install @anthropic-ai/sdk` |

**Missing dependencies with no fallback:**

- None (all have installation commands)

**Missing dependencies with fallback:**

- None

## Validation Architecture

### Test Framework

| Property           | Value                                            |
| ------------------ | ------------------------------------------------ |
| Framework          | Vitest 3.2.4                                     |
| Config file        | vitest.config.ts                                 |
| Quick run command  | `npm run test:unit -- tests/admin/users.test.ts` |
| Full suite command | `npm run test:unit`                              |

### Phase Requirements → Test Map

| Req ID   | Behavior                                  | Test Type        | Automated Command                        | File Exists? |
| -------- | ----------------------------------------- | ---------------- | ---------------------------------------- | ------------ |
| ADMIN-01 | CRUD users, CSV import, bulk operations   | unit/integration | `vitest tests/admin/users.test.ts`       | ❌ Wave 0    |
| ADMIN-02 | CRUD projects, member management          | unit/integration | `vitest tests/admin/projects.test.ts`    | ❌ Wave 0    |
| ADMIN-03 | Permission checks (RBAC + Resource-based) | unit/integration | `vitest tests/admin/permissions.test.ts` | ❌ Wave 0    |
| ADMIN-04 | Audit log filtering                       | integration      | `vitest tests/admin/audit-logs.test.ts`  | ❌ Wave 0    |
| ADMIN-05 | AI config CRUD, test connection           | unit/integration | `vitest tests/admin/ai.test.ts`          | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `vitest tests/admin/[feature].test.ts` (feature-specific test file)
- **Per wave merge:** `npm run test:unit` (full unit test suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/admin/users.test.ts` - covers ADMIN-01 (CRUD, CSV import, bulk operations)
- [ ] `tests/admin/projects.test.ts` - covers ADMIN-02 (CRUD, member management)
- [ ] `tests/admin/permissions.test.ts` - covers ADMIN-03 (RBAC + Resource-based checks)
- [ ] `tests/admin/ai.test.ts` - covers ADMIN-05 (CRUD, test connection)
- [ ] `tests/conftest.ts` - shared fixtures for admin tests (mock admin user, mock API client)

## Sources

### Primary (HIGH confidence)

- [TanStack Table v8](https://context7.com/tanstack/table) - Filtering, sorting, pagination, row selection patterns
- [PapaParse](https://context7.com/mholt/papaparse) - CSV parsing with error handling
- [OpenAI Node SDK](https://context7.com/openai/openai-node) - API key validation, error handling
- [Prisma Schema](prisma/schema.prisma) - Database models (User, Project, project_members, ai_configs, email_configs, webhooks)
- [Existing Admin Pages](<src/app/(main)/admin/>) - Current UI patterns (users page with full CRUD, other pages with tabs)

### Secondary (MEDIUM confidence)

- [@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk) - Anthropic API integration (0.80.0)
- [Webhook Test API](src/app/api/v1/webhooks/test/route.ts) - Test connection pattern (AbortController, timeout handling)
- [Admin APIs](src/app/api/v1/admin/) - Existing API endpoints (users CRUD, partial AI/email)
- [RBAC Best Practices](https://www.permit.io/blog/implementing-prisma-rbac-fine-grained-prisma-permissions) - Prisma RBAC design patterns

### Tertiary (LOW confidence)

- [Next.js Admin Dashboard Guide](https://adminlte.io/blog/build-admin-dashboard-shadcn-nextjs/) - General admin patterns (2026 guide, not verified)
- [Gmail-like Multi-select](https://www.skcript.com/blog/build-gmail-like-multi-select-nextjs) - Bulk operations UI pattern (not verified)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries verified with Context7 or npm registry
- Architecture: HIGH - Based on existing codebase patterns and official documentation
- Pitfalls: MEDIUM - Some TanStack v8 migration patterns need verification
- API endpoints: HIGH - All existing endpoints reviewed via code inspection
- Permission model: MEDIUM - RBAC pattern requires implementation decisions

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days for stable stack, libraries unlikely to change)
