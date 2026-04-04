# Phase 07 UAT Issues 修复计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复管理后台UAT测试发现的16个issues和10个blocked tests，恢复所有核心功能

**Architecture:** 优先修复blocker级别的页面崩溃问题，然后修复major级别的功能缺陷，最后处理minor级别的UI一致性问题

**Tech Stack:** Next.js 15, React 18, TypeScript, TanStack Table, shadcn/ui, Prisma

**UAT Results:** 4 passed, 16 issues, 10 blocked, 3 minor

---

## Phase 1: Blocker Fixes (阻塞级修复)

### Task 1: 修复项目管理页面崩溃 - MembersPanel数据结构

**问题:** `Cannot read properties of undefined (reading 'avatar')` at MembersPanel.tsx:241

**根本原因:** `member.users` 可能为 undefined，成员数据结构不匹配

**Files:**

- Modify: `src/app/(main)/admin/projects/components/MembersPanel.tsx:241`
- Test: 手动访问 `/admin/projects` 页面

**Step 1: 添加安全检查和默认值**

```typescript
// 在 MembersPanel.tsx 第241行附近
// 修改前：
<AvatarImage src={member.users.avatar} alt={member.users.name} />

// 修改后：
<AvatarImage
  src={member.users?.avatar || ''}
  alt={member.users?.name || 'Unknown User'}
/>
```

**Step 2: 修复AvatarFallback**

```typescript
// 修改前：
{
  member.users.name.slice(0, 2).toUpperCase()
}

// 修改后：
{
  ;(member.users?.name || 'UN').slice(0, 2).toUpperCase()
}
```

**Step 3: 在整个组件中添加安全检查**

查找所有 `member.users` 的使用位置，添加可选链操作符：

```typescript
// 示例
member.users?.name
member.users?.email
member.users?.avatar
```

**Step 4: 测试验证**

1. 访问 `/admin/projects` 页面
2. 确认页面正常加载，显示项目列表
3. 确认成员信息正确显示

**Step 5: Commit**

```bash
git add src/app/\(main\)/admin/projects/components/MembersPanel.tsx
git commit -m "fix(admin): handle undefined member.users in MembersPanel

- Add optional chaining for member.users properties
- Provide default values for avatar and name
- Fix runtime TypeError when member data is incomplete

Fixes #5 (blocker)"
```

---

### Task 2: 修复邮件配置页面崩溃 - logs变量类型错误

**问题:** `logs.slice is not a function` at email/page.tsx:242

**根本原因:** `logs` 变量不是数组，可能是 undefined 或 null

**Files:**

- Modify: `src/app/(main)/admin/email/page.tsx:242`
- Test: 手动访问 `/admin/email` 页面

**Step 1: 添加类型检查和默认值**

```typescript
// 在 email/page.tsx 第242行附近
// 修改前：
logs.slice(0, 20).map((log) => (

// 修改后：
(Array.isArray(logs) ? logs : []).slice(0, 20).map((log) => (
```

**Step 2: 在组件初始化时设置默认值**

```typescript
// 在组件顶部，state声明附近
const [logs, setLogs] = useState<EmailLog[]>([])

// 确保API响应处理正确
useEffect(() => {
  fetchEmailLogs()
    .then((data) => {
      setLogs(Array.isArray(data) ? data : [])
    })
    .catch(() => {
      setLogs([])
    })
}, [])
```

**Step 3: 添加空状态处理**

```typescript
// 修改条件判断
{!logs || logs.length === 0 ? (
  <div className="text-muted-foreground p-8 text-center">暂无发送记录</div>
) : (
  logs.slice(0, 20).map((log) => (
    // ... existing code
  ))
)}
```

**Step 4: 测试验证**

1. 访问 `/admin/email` 页面
2. 确认页面正常加载，显示邮件配置列表
3. 确认发送记录正确显示或显示空状态

**Step 5: Commit**

```bash
git add src/app/\(main\)/admin/email/page.tsx
git commit -m "fix(admin): handle undefined logs in email config page

- Add array type check before using slice
- Set default empty array for logs state
- Add proper error handling

Fixes #14 (blocker)"
```

---

### Task 3: 修复权限配置页面功能缺失

**问题:** 权限配置页面无法使用，功能完全不工作

**根本原因:** 页面初始化失败或API路由错误

**Files:**

- Modify: `src/app/(main)/admin/permissions/page.tsx`
- Modify: `src/app/api/v1/admin/permissions/route.ts`
- Test: 手动访问 `/admin/permissions` 页面

**Step 1: 检查并修复权限配置页面初始化**

```typescript
// src/app/(main)/admin/permissions/page.tsx
// 确保useEffect正确加载数据
useEffect(() => {
  async function loadProjects() {
    try {
      const response = await fetch('/api/v1/admin/permissions')
      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading permissions:', error)
      toast.error('加载权限配置失败')
      setProjects([])
    }
  }
  loadProjects()
}, [])
```

**Step 2: 添加空状态UI**

```typescript
// 在权限配置页面添加空状态提示
{!projects || projects.length === 0 ? (
  <div className="text-center p-8 text-muted-foreground">
    <ShieldCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
    <p>暂无项目权限配置</p>
    <p className="text-sm mt-2">请先创建项目后再配置权限</p>
  </div>
) : (
  // existing permission tree and editor
)}
```

**Step 3: 检查API路由**

```typescript
// src/app/api/v1/admin/permissions/route.ts
// 确保GET方法正确返回数据
export async function GET(req: NextRequest) {
  try {
    const user = await checkAdmin(req)
    if (!user) {
      return ApiResponder.unauthorized()
    }

    const permissions = await prisma.projectMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return ApiResponder.success(permissions)
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return ApiResponder.error('INTERNAL_ERROR', 'Failed to fetch permissions')
  }
}
```

**Step 4: 测试验证**

1. 访问 `/admin/permissions` 页面
2. 确认页面正常加载，显示项目列表
3. 点击项目，确认右侧权限编辑器正确显示

**Step 5: Commit**

```bash
git add src/app/\(main\)/admin/permissions/page.tsx src/app/api/v1/admin/permissions/route.ts
git commit -m "fix(admin): fix permissions page initialization and error handling

- Add proper error handling in permissions page
- Add empty state UI for no projects
- Ensure API returns proper data structure
- Add console error logging for debugging

Fixes #20 (blocker)"
```

---

### Task 4: 解锁项目设置页面访问

**问题:** 项目设置页面无法访问（依赖Task 1修复）

**Files:**

- Verify: `src/app/(main)/admin/projects/[id]/settings/page.tsx`
- Test: 通过项目页面进入设置页面

**Step 1: 验证项目页面已修复**

确认Task 1已修复，项目页面可以正常访问。

**Step 2: 添加项目设置入口**

```typescript
// 在项目管理页面的操作列添加设置按钮
<Button
  variant="ghost"
  size="sm"
  onClick={() => router.push(`/admin/projects/${project.id}/settings`)}
>
  <Settings className="h-4 w-4" />
</Button>
```

**Step 3: 测试验证**

1. 访问 `/admin/projects` 页面
2. 点击项目的"设置"按钮
3. 确认进入项目设置页面，显示三个Tab

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/projects/page.tsx
git commit -m "feat(admin): add settings button to project list

- Add navigation to project settings page
- Users can now access Webhook, Notification, and Defaults tabs

Related to #25"
```

---

## Phase 2: Major Fixes (严重级修复)

### Task 5: 修复批量操作后状态不立即更新

**问题:** 批量激活/禁用/修改角色后，需要刷新页面才能看到变化

**根本原因:** 操作成功后未更新本地状态

**Files:**

- Modify: `src/app/(main)/admin/users/page.tsx`
- Test: 批量操作测试

**Step 1: 在批量操作成功后更新本地数据**

```typescript
// 在批量操作的处理函数中
const handleBulkStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
  try {
    const response = await fetch('/api/v1/admin/users/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({ userIds: selectedRows, status }),
    })

    if (response.ok) {
      toast.success(`批量${status === 'ACTIVE' ? '激活' : '禁用'}成功`)

      // 关键：更新本地数据
      setUsers((prevUsers) =>
        prevUsers.map((user) => (selectedRows.includes(user.id) ? { ...user, status } : user))
      )

      setSelectedRows([])
    }
  } catch (error) {
    toast.error('操作失败')
  }
}
```

**Step 2: 批量修改角色后更新本地数据**

```typescript
const handleBulkRole = async (role: string) => {
  try {
    const response = await fetch('/api/v1/admin/users/bulk/role', {
      method: 'PATCH',
      body: JSON.stringify({ userIds: selectedRows, role }),
    })

    if (response.ok) {
      toast.success('批量修改角色成功')

      // 关键：更新本地数据
      setUsers((prevUsers) =>
        prevUsers.map((user) => (selectedRows.includes(user.id) ? { ...user, role } : user))
      )

      setSelectedRows([])
    }
  } catch (error) {
    toast.error('操作失败')
  }
}
```

**Step 3: 测试验证**

1. 选择多个用户，点击"激活"
2. 确认状态立即更新为ACTIVE，无需刷新
3. 选择多个用户，修改角色
4. 确认角色立即更新，无需刷新

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/users/page.tsx
git commit -m "fix(admin): update local state after bulk operations

- Update user status locally after bulk status change
- Update user role locally after bulk role change
- Remove need for page refresh

Fixes #3, #4 (major)"
```

---

### Task 6: 修复React Hydration Mismatch错误

**问题:** className顺序在服务端和客户端不一致

**根本原因:** className字符串拼接顺序不确定

**Files:**

- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/app/(main)/admin/users/page.tsx` (如有类似问题)

**Step 1: 使用clsx或cn函数确保className顺序一致**

```typescript
// 在 AppLayout.tsx
import { cn } from '@/lib/utils';

// 修改前：
<div className="bg-background flex h-screen items-center justify-center">

// 修改后：
<div className={cn(
  "flex h-screen items-center justify-center bg-background"
)}>
```

**Step 2: 修复spinner组件的className**

```typescript
// 修改前：
<div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />

// 修改后：
<div className={cn(
  "mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
)} />
```

**Step 3: 测试验证**

1. 打开浏览器开发者工具Console
2. 刷新页面，确认无hydration错误
3. 检查Network面板，确认SSR HTML与客户端一致

**Step 4: Commit**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "fix: resolve React hydration mismatch

- Use cn() utility to ensure consistent className order
- Fix SSR/client mismatch for loading spinner
- Follow Tailwind best practices for className ordering

Fixes #3 (major)"
```

---

### Task 7: 修复创建项目无法选择负责人

**问题:** 负责人选择器组件不工作

**根本原因:** Select组件或数据加载问题

**Files:**

- Modify: `src/app/(main)/admin/projects/components/ProjectDialog.tsx` (或创建)
- Test: 创建项目测试

**Step 1: 检查并修复负责人选择器**

```typescript
// 确保使用正确的Select组件
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 在ProjectDialog中
<Select
  value={formData.ownerId}
  onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="选择负责人" />
  </SelectTrigger>
  <SelectContent>
    {users.map((user) => (
      <SelectItem key={user.id} value={user.id}>
        {user.name} ({user.email})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Step 2: 确保用户列表已加载**

```typescript
useEffect(() => {
  async function loadUsers() {
    try {
      const response = await fetch('/api/v1/users')
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
    }
  }
  loadUsers()
}, [])
```

**Step 3: 测试验证**

1. 点击"创建项目"
2. 点击负责人下拉框
3. 确认显示用户列表，可以选择

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/projects/components/ProjectDialog.tsx
git commit -m "fix(admin): fix owner selector in project creation dialog

- Use shadcn Select component correctly
- Ensure users are loaded before rendering
- Add error handling for user fetch

Fixes #6 (major)"
```

---

### Task 8: 添加项目管理编辑功能

**问题:** 项目管理页面缺少编辑按钮

**Files:**

- Modify: `src/app/(main)/admin/projects/page.tsx`
- Modify: `src/app/(main)/admin/projects/components/ProjectDialog.tsx`
- Test: 编辑项目测试

**Step 1: 添加编辑按钮**

```typescript
// 在项目列表的操作列添加编辑按钮
<Button
  variant="ghost"
  size="sm"
  onClick={() => openEditDialog(project)}
>
  <Edit className="h-4 w-4" />
</Button>
```

**Step 2: 实现编辑对话框**

```typescript
const openEditDialog = (project: Project) => {
  setEditingProject(project)
  setFormData({
    name: project.name,
    description: project.description || '',
    ownerId: project.ownerId,
  })
  setIsDialogOpen(true)
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const url = editingProject
    ? `/api/v1/admin/projects/${editingProject.id}`
    : '/api/v1/admin/projects'

  const method = editingProject ? 'PUT' : 'POST'

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      toast.success(editingProject ? '项目更新成功' : '项目创建成功')
      setIsDialogOpen(false)
      loadProjects() // Reload project list
    }
  } catch (error) {
    toast.error('操作失败')
  }
}
```

**Step 3: 测试验证**

1. 点击项目的"编辑"按钮
2. 确认弹出编辑对话框，显示现有项目信息
3. 修改信息并提交
4. 确认项目信息更新成功

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/projects/page.tsx src/app/\(main\)/admin/projects/components/ProjectDialog.tsx
git commit -m "feat(admin): add project edit functionality

- Add edit button to project list
- Implement edit dialog with existing data
- Support both create and edit modes in ProjectDialog

Fixes #7 (major)"
```

---

### Task 9: 添加项目管理归档功能

**问题:** 项目管理页面缺少归档功能

**Files:**

- Modify: `src/app/(main)/admin/projects/page.tsx`
- Test: 归档/取消归档项目测试

**Step 1: 添加归档按钮**

```typescript
// 在项目列表的操作列添加归档按钮
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleArchive(project)}
>
  {project.status === 'ARCHIVED' ? (
    <ArchiveRestore className="h-4 w-4" />
  ) : (
    <Archive className="h-4 w-4" />
  )}
</Button>
```

**Step 2: 实现归档/取消归档功能**

```typescript
const handleArchive = async (project: Project) => {
  const newStatus = project.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED'
  const action = newStatus === 'ARCHIVED' ? '归档' : '取消归档'

  // 使用AlertDialog确认
  setConfirmDialog({
    open: true,
    title: `确认${action}项目`,
    description: `确定要${action}"${project.name}"吗？`,
    onConfirm: async () => {
      try {
        const response = await fetch(`/api/v1/admin/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })

        if (response.ok) {
          toast.success(`${action}成功`)
          loadProjects() // Reload project list
        }
      } catch (error) {
        toast.error(`${action}失败`)
      }
      setConfirmDialog({ ...confirmDialog, open: false })
    },
  })
}
```

**Step 3: 测试验证**

1. 点击项目的"归档"按钮
2. 确认弹出确认对话框
3. 确认归档后，项目显示ARCHIVED徽章
4. 点击"取消归档"，确认恢复为ACTIVE

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/projects/page.tsx
git commit -m "feat(admin): add project archive/unarchive functionality

- Add archive button with icon toggle
- Implement AlertDialog for confirmation
- Support both archive and unarchive operations
- Update project status locally after operation

Fixes #9 (major)"
```

---

### Task 10: 支持AI配置自定义API URL

**问题:** AI配置页面自定义服务商仅支持Ollama

**Files:**

- Modify: `src/app/(main)/admin/ai/components/AIConfigDialog.tsx`
- Modify: `src/app/api/v1/admin/ai/configs/route.ts`
- Test: AI配置测试

**Step 1: 添加自定义URL输入框**

```typescript
// 在AIConfigDialog中
<Select
  value={formData.provider}
  onValueChange={(value) => setFormData({ ...formData, provider: value })}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="OPENAI">OpenAI</SelectItem>
    <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
    <SelectItem value="OLLAMA">Ollama</SelectItem>
    <SelectItem value="CUSTOM">自定义</SelectItem>
  </SelectContent>
</Select>

{formData.provider === 'CUSTOM' && (
  <div className="space-y-2">
    <Label>API Base URL</Label>
    <Input
      placeholder="https://api.example.com/v1"
      value={formData.baseUrl}
      onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
    />
  </div>
)}
```

**Step 2: 更新API路由支持自定义URL**

```typescript
// src/app/api/v1/admin/ai/configs/route.ts
// 确保保存baseUrl字段

if (provider === 'CUSTOM' && !baseUrl) {
  return ApiResponder.badRequest('Base URL is required for custom provider')
}

const config = await prisma.aIConfig.create({
  data: {
    provider,
    apiKey,
    baseUrl: provider === 'CUSTOM' ? baseUrl : null,
    // ... other fields
  },
})
```

**Step 3: 测试验证**

1. 访问AI配置页面
2. 点击"创建"，选择"自定义"
3. 输入自定义API URL
4. 确认配置保存成功

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/ai/components/AIConfigDialog.tsx src/app/api/v1/admin/ai/configs/route.ts
git commit -m "feat(admin): support custom API URL for AI config

- Add CUSTOM provider option
- Show Base URL input for custom provider
- Update API to save and validate baseUrl

Fixes #11 (major)"
```

---

### Task 11: 支持模板多种格式

**问题:** 模板仅支持JSON格式

**Files:**

- Modify: `src/app/(main)/admin/templates/components/TemplateDialog.tsx`
- Modify: `src/app/api/v1/admin/templates/route.ts`
- Test: 模板创建测试

**Step 1: 添加格式选择器**

```typescript
// 在TemplateDialog中
<Select
  value={formData.format}
  onValueChange={(value) => setFormData({ ...formData, format: value })}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="JSON">JSON</SelectItem>
    <SelectItem value="TEXT">纯文本</SelectItem>
    <SelectItem value="MARKDOWN">Markdown</SelectItem>
  </SelectContent>
</Select>

<Textarea
  placeholder={getPlaceholder(formData.format)}
  value={formData.content}
  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
  className="font-mono"
  rows={10}
/>
```

**Step 2: 添加格式提示**

```typescript
const getPlaceholder = (format: string) => {
  switch (format) {
    case 'JSON':
      return '{"title": "任务标题", "description": "任务描述"}'
    case 'MARKDOWN':
      return '# 任务标题\n\n任务描述...'
    default:
      return '输入模板内容，支持使用{{variable}}占位符'
  }
}
```

**Step 3: 更新数据库schema（如需要）**

```prisma
// prisma/schema.prisma
model Template {
  // ... existing fields
  format String @default("JSON") // JSON, TEXT, MARKDOWN
}
```

**Step 4: 测试验证**

1. 访问模板管理页面
2. 点击"创建模板"
3. 选择不同格式（JSON、TEXT、Markdown）
4. 确认内容可以正确保存和显示

**Step 5: Commit**

```bash
git add src/app/\(main\)/admin/templates/components/TemplateDialog.tsx src/app/api/v1/admin/templates/route.ts prisma/schema.prisma
git commit -m "feat(admin): support multiple template formats

- Add format selector (JSON, TEXT, MARKDOWN)
- Update UI to show format-specific placeholder
- Add format field to Template model
- Support flexible content input

Fixes #17 (major)"
```

---

### Task 12: 添加模板预览功能

**问题:** 模板编辑对话框缺少预览面板

**Files:**

- Modify: `src/app/(main)/admin/templates/components/TemplateDialog.tsx`
- Test: 模板预览测试

**Step 1: 添加预览面板**

```typescript
// 在TemplateDialog中添加预览区域
<div className="grid grid-cols-2 gap-4">
  {/* 左侧：编辑器 */}
  <div className="space-y-2">
    <Label>内容</Label>
    <Textarea
      value={formData.content}
      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
      className="font-mono"
      rows={15}
    />
  </div>

  {/* 右侧：预览 */}
  <div className="space-y-2">
    <Label>预览</Label>
    <div
      className="border rounded-md p-4 min-h-[300px] prose prose-sm dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: highlightVariables(formData.content) }}
    />
  </div>
</div>
```

**Step 2: 实现变量高亮函数**

```typescript
const highlightVariables = (content: string) => {
  // 高亮 {{variable}} 占位符
  return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return `<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">${match}</mark>`
  })
}
```

**Step 3: 测试验证**

1. 在模板编辑对话框输入内容
2. 确认右侧预览实时显示
3. 确认 `{{variable}}` 以黄色高亮显示

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/templates/components/TemplateDialog.tsx
git commit -m "feat(admin): add template preview with variable highlighting

- Add live preview panel next to editor
- Highlight {{variable}} placeholders in yellow
- Support real-time preview updates

Fixes #18 (major)"
```

---

### Task 13: 修复模板导入/导出功能

**问题:** 不支持模板内容的导出以及导入

**Files:**

- Modify: `src/app/(main)/admin/templates/page.tsx`
- Test: 模板导入/导出测试

**Step 1: 实现导出功能**

```typescript
const handleExport = async () => {
  try {
    const response = await fetch(`/api/v1/admin/templates?type=${activeTab}`)
    const templates = await response.json()

    const json = JSON.stringify(templates, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-templates-${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
    toast.success('导出成功')
  } catch (error) {
    toast.error('导出失败')
  }
}
```

**Step 2: 实现导入功能**

```typescript
const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const templates = JSON.parse(text)

    // 批量导入
    for (const template of templates) {
      await fetch('/api/v1/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          type: activeTab === 'task' ? 'TASK' : 'REVIEW',
        }),
      })
    }

    toast.success(`成功导入 ${templates.length} 个模板`)
    loadTemplates() // Reload
  } catch (error) {
    toast.error('导入失败，请检查文件格式')
  }
}
```

**Step 3: 测试验证**

1. 点击"导出"，确认下载JSON文件
2. 修改JSON文件内容
3. 点击"导入"，选择文件
4. 确认模板成功导入

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/templates/page.tsx
git commit -m "fix(admin): implement template import/export functionality

- Add export to JSON with proper filename
- Add import from JSON with batch processing
- Add error handling for invalid files
- Show success/error toast notifications

Fixes #19 (major)"
```

---

### Task 14: 修复暗色主题适配

**问题:** 里程碑管理、需求管理、问题管理页面暗色主题未适配

**Files:**

- Modify: `src/app/(main)/milestones/page.tsx` (或相关页面)
- Modify: `src/app/(main)/requirements/page.tsx` (或相关页面)
- Modify: `src/app/(main)/issues/page.tsx` (或相关页面)
- Test: 主题切换测试

**Step 1: 检查并修复暗色主题样式**

```typescript
// 确保所有颜色使用Tailwind的dark:前缀
// 示例：
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <h1 className="text-gray-800 dark:text-gray-200">标题</h1>
  <p className="text-gray-600 dark:text-gray-400">内容</p>
</div>

// 徽章颜色
<Badge className="bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
  状态
</Badge>
```

**Step 2: 添加返回导航按钮**

```typescript
// 在每个页面顶部添加面包屑导航
<div className="mb-4">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => router.push('/dashboard')}
  >
    <Home className="h-4 w-4 mr-2" />
    返回首页
  </Button>
</div>
```

**Step 3: 测试验证**

1. 切换到暗色主题
2. 访问里程碑、需求、问题管理页面
3. 确认所有UI元素正确渲染
4. 确认返回按钮正常工作

**Step 4: Commit**

```bash
git add src/app/\(main\)/milestones/page.tsx src/app/\(main\)/requirements/page.tsx src/app/\(main\)/issues/page.tsx
git commit -m "fix: add dark mode support and navigation for management pages

- Add dark: variant to all color classes
- Fix background and text colors for dark mode
- Add navigation button to return to dashboard
- Ensure consistent styling across all management pages

Fixes #30 (major)"
```

---

## Phase 3: Minor Fixes (次要级修复)

### Task 15: 替换删除确认对话框为shadcn Dialog

**问题:** 删除项目使用浏览器原生confirm()

**Files:**

- Modify: `src/app/(main)/admin/projects/page.tsx`
- Test: 删除项目测试

**Step 1: 使用AlertDialog替换confirm()**

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// State
const [deleteDialog, setDeleteDialog] = useState({ open: false, projectId: '' });

// 处理函数
const handleDelete = (projectId: string) => {
  setDeleteDialog({ open: true, projectId });
};

const confirmDelete = async () => {
  try {
    const response = await fetch(`/api/v1/admin/projects/${deleteDialog.projectId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      toast.success('项目删除成功');
      loadProjects();
    }
  } catch (error) {
    toast.error('删除失败');
  } finally {
    setDeleteDialog({ open: false, projectId: '' });
  }
};

// AlertDialog组件
<AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除项目</AlertDialogTitle>
      <AlertDialogDescription>
        此操作无法撤销。项目及其所有数据将被永久删除。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
        删除
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Step 2: 测试验证**

1. 点击项目的"删除"按钮
2. 确认弹出shadcn AlertDialog（不是浏览器confirm）
3. 点击"删除"，确认项目被删除

**Step 3: Commit**

```bash
git add src/app/\(main\)/admin/projects/page.tsx
git commit -m "refactor(admin): replace browser confirm with shadcn AlertDialog

- Use AlertDialog component for delete confirmation
- Improve UX with better styled confirmation dialog
- Maintain consistency with other admin pages

Fixes #8 (minor)"
```

---

### Task 16: 支持批量添加项目成员

**问题:** 添加项目成员一次只能选择一个

**Files:**

- Modify: `src/app/(main)/admin/projects/components/MembersPanel.tsx`
- Test: 批量添加成员测试

**Step 1: 使用多选组件**

```typescript
import { MultiSelect } from '@/components/ui/multi-select';

// 替换单选为多选
<MultiSelect
  options={users.map(u => ({ label: u.name, value: u.id }))}
  selected={selectedUsers}
  onChange={setSelectedUsers}
  placeholder="选择成员"
/>

<Button onClick={handleAddMembers}>
  添加 {selectedUsers.length} 个成员
</Button>
```

**Step 2: 实现批量添加**

```typescript
const handleAddMembers = async () => {
  if (selectedUsers.length === 0) return

  try {
    const promises = selectedUsers.map((userId) =>
      fetch('/api/v1/admin/projects/[id]/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: selectedRole }),
      })
    )

    await Promise.all(promises)
    toast.success(`成功添加 ${selectedUsers.length} 个成员`)
    setSelectedUsers([])
    loadMembers()
  } catch (error) {
    toast.error('添加失败')
  }
}
```

**Step 3: 测试验证**

1. 点击"添加成员"
2. 选择多个用户
3. 确认所有用户都被添加

**Step 4: Commit**

```bash
git add src/app/\(main\)/admin/projects/components/MembersPanel.tsx
git commit -m "feat(admin): support batch adding project members

- Use multi-select component for user selection
- Implement batch add with Promise.all
- Show count of selected users
- Improve UX for adding multiple members

Fixes #10 (minor)"
```

---

## Phase 4: Verification (验证阶段)

### Task 17: 运行完整UAT验证

**目标:** 重新运行所有30个测试用例，确认修复效果

**Step 1: 清理测试环境**

```bash
# 重置数据库到干净状态
npm run db:migrate:reset

# 重启开发服务器
npm run dev
```

**Step 2: 重新执行UAT测试**

按照 `.planning/phases/07-guan-li-hou-tai/07-UAT.md` 中的30个测试用例，逐个验证：

- ✅ 确认通过的测试保持通过
- ✅ 确认所有blocker问题已修复
- ✅ 确认major问题已修复
- ✅ 确认minor问题已修复
- ✅ 确认blocked测试可以执行

**Step 3: 更新UAT文件**

```markdown
---
status: verified
phase: 07-guan-li-hou-tai
verified_at: [当前时间]
---
```

**Step 4: 提交验证结果**

```bash
git add .planning/phases/07-guan-li-hou-tai/07-UAT.md
git commit -m "test(07): verify UAT fixes - all issues resolved

- Fix 4 blocker issues
- Fix 12 major issues
- Fix 3 minor issues
- All 30 tests now passing or verified

Closes #5, #14, #20, #25, #3, #4, #6, #7, #8, #9, #10, #11, #17, #18, #19, #30"
```

---

## 执行优先级总结

| Phase     | Tasks        | Priority        | Estimated Time |
| --------- | ------------ | --------------- | -------------- |
| Phase 1   | Task 1-4     | 🔴 Blocker      | 2-3 hours      |
| Phase 2   | Task 5-14    | 🟠 Major        | 4-5 hours      |
| Phase 3   | Task 15-16   | 🟡 Minor        | 1 hour         |
| Phase 4   | Task 17      | ✅ Verification | 1 hour         |
| **Total** | **17 Tasks** |                 | **8-10 hours** |

## 依赖关系

```
Task 1 (项目页面修复) → Task 4 (项目设置访问)
Task 2 (邮件页面修复) → 无依赖
Task 3 (权限页面修复) → 无依赖
Task 5-16 → 无依赖，可并行执行
Task 17 → 依赖所有修复完成
```

## 执行建议

**选项 1: 顺序执行（推荐用于学习）**

- 按Phase 1 → Phase 2 → Phase 3 → Phase 4顺序执行
- 每个Task完成后立即测试验证

**选项 2: 并行执行（推荐用于快速修复）**

- Phase 1的Task 1-3可并行执行（无依赖）
- Phase 2的Task 5-14可并行执行（无依赖）
- Phase 3的Task 15-16可并行执行
- Phase 4必须最后执行

---

**Plan complete and saved to `docs/plans/2026-04-03-admin-uat-fixes.md`.**

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach do you prefer?**
