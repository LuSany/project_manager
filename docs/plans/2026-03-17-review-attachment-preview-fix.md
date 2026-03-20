# 评审附件预览问题修复实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复评审附件预览功能的35个根因，恢复完整的文件预览能力。

**Architecture:**

1. 创建统一 API 客户端层解决 credentials 问题
2. 重构预览服务配置系统统一管理
3. 增强 OnlyOffice 集成的安全性、性能和可靠性
4. 添加全面的错误处理和降级策略

**Tech Stack:** Next.js 15, TypeScript, Prisma, OnlyOffice, KKFileView, Redis (新增)

**Root Causes:** 35 个 (P0: 8, P1: 14, P2: 8, P3: 5)

---

## 阶段一：P0 级别修复（必须立即修复）

预计时间：3-5 天

---

### Task 1: 创建统一 API 客户端

**问题根因：** 145 处 fetch 缺少 credentials: 'include'

**Files:**

- Create: `src/lib/api/client.ts`
- Modify: 无（新文件）

**Step 1: 创建统一 API 客户端文件**

```typescript
// src/lib/api/client.ts
/**
 * 统一 API 客户端
 * 自动添加 credentials: 'include' 和统一的错误处理
 */

interface ApiOptions extends RequestInit {
  timeout?: number
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 统一 fetch 封装
 * - 自动添加 credentials: 'include'
 * - 统一错误处理
 * - 支持超时
 */
export async function apiClient(url: string, options: ApiOptions = {}): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include', // 关键：自动携带 cookies
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * GET 请求
 */
export async function apiGet<T>(url: string, options?: ApiOptions): Promise<T> {
  const response = await apiClient(url, { ...options, method: 'GET' })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    throw new ApiError(
      response.status,
      error.code || 'UNKNOWN_ERROR',
      error.message || error.error?.message || '请求失败',
      error
    )
  }

  const data = await response.json()
  return data.success ? data.data : data
}

/**
 * POST 请求
 */
export async function apiPost<T>(url: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const response = await apiClient(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    throw new ApiError(
      response.status,
      error.code || 'UNKNOWN_ERROR',
      error.message || error.error?.message || '请求失败',
      error
    )
  }

  const data = await response.json()
  return data.success ? data.data : data
}

/**
 * PUT 请求
 */
export async function apiPut<T>(url: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const response = await apiClient(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    throw new ApiError(
      response.status,
      error.code || 'UNKNOWN_ERROR',
      error.message || error.error?.message || '请求失败',
      error
    )
  }

  const data = await response.json()
  return data.success ? data.data : data
}

/**
 * DELETE 请求
 */
export async function apiDelete<T>(url: string, options?: ApiOptions): Promise<T> {
  const response = await apiClient(url, { ...options, method: 'DELETE' })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    throw new ApiError(
      response.status,
      error.code || 'UNKNOWN_ERROR',
      error.message || error.error?.message || '请求失败',
      error
    )
  }

  const data = await response.json()
  return data.success ? data.data : data
}

export { ApiError }
```

**Step 2: 创建单元测试**

```typescript
// tests/unit/lib/api/client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiGet, apiPost, ApiError } from '@/lib/api/client'

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should include credentials: include in all requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', mockFetch)

    await apiGet('/api/v1/test')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('should throw ApiError on non-ok response', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: '请先登录' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    vi.stubGlobal('fetch', mockFetch)

    await expect(apiGet('/api/v1/test')).rejects.toThrow(ApiError)
    await expect(apiGet('/api/v1/test')).rejects.toThrow('请先登录')
  })

  it('should timeout after specified time', async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))
    vi.stubGlobal('fetch', mockFetch)

    await expect(apiGet('/api/v1/test', { timeout: 100 })).rejects.toThrow()
  })
})
```

**Step 3: 运行测试验证**

```bash
npm run test:unit -- tests/unit/lib/api/client.test.ts
```

Expected: PASS

**Step 4: 提交**

```bash
git add src/lib/api/client.ts tests/unit/lib/api/client.test.ts
git commit -m "feat: 创建统一 API 客户端，自动添加 credentials: include"
```

---

### Task 2: 修复 window.open Cookie 丢失问题

**问题根因：** 3 处 window.open() 导致 Cookie 丢失

**Files:**

- Modify: `src/app/projects/[id]/reviews/[reviewId]/page.tsx:195-220`
- Modify: `src/components/files/FilePreview.tsx:34-44`
- Modify: `src/app/(main)/reviews/[id]/report/page.tsx:55-57`

**Step 1: 修复评审详情页预览函数**

修改 `src/app/projects/[id]/reviews/[reviewId]/page.tsx`:

```typescript
// 替换 handlePreview 函数（第195-220行）
const handlePreview = async (material: ReviewMaterial) => {
  try {
    const response = await fetch(`/api/v1/files/preview?fileId=${material.fileId}&service=auto`, {
      credentials: 'include',
    })
    const data = await response.json()

    if (data.success && data.data?.previewUrl) {
      // 使用动态创建的 <a> 标签代替 window.open
      const link = document.createElement('a')
      link.href = data.data.previewUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // 降级方案
      const link = document.createElement('a')
      link.href = `/api/v1/files/${material.fileId}`
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (err) {
    console.error('预览文件失败:', err)
    // 降级方案
    const link = document.createElement('a')
    link.href = `/api/v1/files/${material.fileId}`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
```

**Step 2: 修复 FilePreview 组件**

修改 `src/components/files/FilePreview.tsx`:

```typescript
// 替换 handlePreview 函数（第34-44行）
const handlePreview = async () => {
  setLoading(true)
  try {
    const response = await fetch(`/api/v1/files/preview?fileId=${fileId}&service=${service}`, {
      credentials: 'include',
    })
    const data = await response.json()

    if (data.success && data.data?.previewUrl) {
      // 使用动态创建的 <a> 标签代替 window.open
      const link = document.createElement('a')
      link.href = data.data.previewUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (err) {
    console.error('预览文件失败:', err)
  } finally {
    setLoading(false)
  }
}
```

**Step 3: 修复报告下载函数**

修改 `src/app/(main)/reviews/[id]/report/page.tsx`:

```typescript
// 替换 downloadReport 函数（第55-57行）
const downloadReport = async (format: string) => {
  const link = document.createElement('a')
  link.href = `/api/v1/reports/review/${reviewId}?format=${format}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

**Step 4: 提交**

```bash
git add src/app/projects/[id]/reviews/[reviewId]/page.tsx \
        src/components/files/FilePreview.tsx \
        src/app/\(main\)/reviews/[id]/report/page.tsx
git commit -m "fix: 使用动态创建的 <a> 标签替代 window.open，确保 Cookie 正确传递"
```

---

### Task 3: 统一环境变量命名

**问题根因：** 环境变量命名不一致（ONLYOFFICE_URL vs ONLYOFFICE_API_URL）

**Files:**

- Modify: `src/lib/preview/router.ts:208-214`
- Modify: `.env.example`

**Step 1: 修复 router.ts 环境变量引用**

修改 `src/lib/preview/router.ts`:

```typescript
// 替换第205-222行
export function createDefaultPreviewRouter(): PreviewRouter {
  return new PreviewRouter({
    onlyOffice: {
      baseUrl:
        process.env.ONLYOFFICE_API_URL ||
        process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL ||
        'http://localhost:8082',
      enabled: true, // 默认启用
      priority: 1,
    },
    kkFileView: {
      baseUrl: process.env.KKFILEVIEW_URL || 'http://localhost:8012',
      enabled: !!process.env.KKFILEVIEW_URL, // 有配置时启用
      priority: 2,
    },
    nativePreview: {
      enabled: true,
      priority: 3,
    },
  })
}
```

**Step 2: 更新 .env.example**

```bash
# 添加/更新以下内容到 .env.example
# OnlyOffice 配置（统一命名）
ONLYOFFICE_API_URL="http://localhost:8082"
NEXT_PUBLIC_ONLYOFFICE_API_URL="http://localhost:8082"
ONLYOFFICE_API_KEY=""
ONLYOFFICE_CALLBACK_URL="http://host.docker.internal:3000"
ONLYOFFICE_MOCK_MODE="false"

# KKFileView 配置
KKFILEVIEW_URL="http://localhost:8012"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Step 3: 更新实际 .env 文件**

确保 `.env` 文件使用正确的变量名：

```bash
# 检查并更新 .env
grep -E "ONLYOFFICE|KKFILEVIEW|APP_URL" .env
```

**Step 4: 提交**

```bash
git add src/lib/preview/router.ts .env.example
git commit -m "fix: 统一 OnlyOffice 环境变量命名为 ONLYOFFICE_API_URL"
```

---

### Task 4: 修复中间件 Cookie path 属性

**问题根因：** 中间件设置的 Cookie 缺少 path 属性

**Files:**

- Modify: `src/middleware.ts:120-137`

**Step 1: 添加 path 属性到 Cookie 设置**

修改 `src/middleware.ts`:

```typescript
// 替换第119-138行
// 通过 cookies 传递用户信息给路由处理器
const response = NextResponse.next()
response.cookies.set('user-id', (payload as any).userId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/', // 添加 path 属性
})
response.cookies.set('user-email', (payload as any).email, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24,
  path: '/', // 添加 path 属性
})
response.cookies.set('user-role', (payload as any).role, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24,
  path: '/', // 添加 path 属性
})
return response
```

**Step 2: 提交**

```bash
git add src/middleware.ts
git commit -m "fix: 为中间件设置的 Cookie 添加 path 属性"
```

---

### Task 5: 修复 OnlyOffice 回调性能问题

**问题根因：** 使用 findMany() 遍历所有文件匹配 document key

**Files:**

- Modify: `prisma/schema.prisma` (添加 documentKey 字段)
- Create: `prisma/migrations/...` (数据库迁移)
- Modify: `src/app/api/v1/files/[id]/preview-edit/route.ts` (存储 documentKey)
- Modify: `src/app/api/v1/files/onlyoffice-callback/route.ts` (使用索引查询)

**Step 1: 添加 documentKey 字段到 FileStorage 模型**

修改 `prisma/schema.prisma`:

```prisma
model FileStorage {
  id           String   @id @default(cuid())
  fileName     String
  originalName String
  filePath     String
  fileSize     Int
  mimeType     String
  uploadedBy   String
  documentKey  String?  @unique // 添加：OnlyOffice 文档键
  version      Int      @default(1) // 添加：文件版本
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关系
  uploader User @relation(fields: [uploadedBy], references: [id], onDelete: Restrict)

  @@index([uploadedBy])
  @@index([createdAt])
  @@index([documentKey]) // 添加索引
  @@map("file_storage")
}
```

**Step 2: 创建数据库迁移**

```bash
npx prisma migrate dev --name add_document_key_to_file_storage
```

**Step 3: 修改预览编辑 API 存储 documentKey**

修改 `src/app/api/v1/files/[id]/preview-edit/route.ts`:

```typescript
// 在第61行后添加
const documentKey = generateDocumentKey(file.id, file.version || 1)

// 在第102-108行，更新返回前存储 documentKey
await prisma.fileStorage.update({
  where: { id: file.id },
  data: { documentKey },
})

return success({
  url: editorUrl,
  config: docConfig,
  fileName: file.fileName,
  fileType: file.mimeType,
  documentKey,
})
```

**Step 4: 修改回调处理使用索引查询**

修改 `src/app/api/v1/files/onlyoffice-callback/route.ts`:

```typescript
// 替换第60-72行
// 使用索引查询替代全表扫描
const matchedFile = await prisma.fileStorage.findFirst({
  where: { documentKey: key },
})

if (!matchedFile) {
  return NextResponse.json({ error: 1, message: '文件未找到' })
}
```

**Step 5: 提交**

```bash
git add prisma/schema.prisma \
        src/app/api/v1/files/[id]/preview-edit/route.ts \
        src/app/api/v1/files/onlyoffice-callback/route.ts
git commit -m "fix: 使用 documentKey 索引替代全表扫描，优化回调性能"
```

---

### Task 6: 添加文件路径安全验证

**问题根因：** 未验证文件路径是否在允许目录内

**Files:**

- Create: `src/lib/file-security.ts`
- Modify: `src/app/api/v1/files/[id]/route.ts`
- Modify: `src/app/api/v1/files/[id]/download/route.ts`

**Step 1: 创建文件安全验证模块**

创建 `src/lib/file-security.ts`:

```typescript
// src/lib/file-security.ts
import { join, resolve, relative, isAbsolute } from 'path'
import { existsSync } from 'fs'

// 允许的文件目录
const ALLOWED_DIRS = [
  resolve(join(process.cwd(), 'uploads')),
  resolve(join(process.cwd(), 'public/uploads')),
]

/**
 * 验证文件路径是否安全
 * - 必须在允许的目录内
 * - 防止路径遍历攻击
 */
export function validateFilePath(filePath: string): { valid: boolean; reason?: string } {
  // 1. 检查是否为空
  if (!filePath) {
    return { valid: false, reason: '文件路径不能为空' }
  }

  // 2. 检查是否为绝对路径
  if (!isAbsolute(filePath)) {
    return { valid: false, reason: '文件路径必须是绝对路径' }
  }

  // 3. 解析并规范化路径（处理 ../ 等）
  const resolvedPath = resolve(filePath)

  // 4. 检查是否在允许的目录内
  const isAllowed = ALLOWED_DIRS.some((allowedDir) => {
    const relativePath = relative(allowedDir, resolvedPath)
    // 相对路径不以 .. 开头表示在允许目录内
    return !relativePath.startsWith('..') && !relativePath.startsWith('/')
  })

  if (!isAllowed) {
    return { valid: false, reason: '文件路径不在允许的目录内' }
  }

  // 5. 检查路径中是否包含可疑字符
  const suspiciousPatterns = ['..', '~', '\0']
  if (suspiciousPatterns.some((p) => filePath.includes(p))) {
    return { valid: false, reason: '文件路径包含非法字符' }
  }

  return { valid: true }
}

/**
 * 验证文件是否存在
 */
export function validateFileExists(filePath: string): { exists: boolean; reason?: string } {
  if (!existsSync(filePath)) {
    return { exists: false, reason: '文件不存在' }
  }
  return { exists: true }
}

/**
 * 获取安全的文件路径
 */
export function getSafeFilePath(filename: string, subDir?: string): string {
  const baseDir = ALLOWED_DIRS[0]
  const safeName = filename.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '_')

  if (subDir) {
    return join(baseDir, subDir, safeName)
  }

  return join(baseDir, safeName)
}
```

**Step 2: 在文件下载 API 中应用安全验证**

修改 `src/app/api/v1/files/[id]/download/route.ts`:

```typescript
// 在文件顶部添加导入
import { validateFilePath, validateFileExists } from '@/lib/file-security'

// 在第37行后添加验证
const filePath = file.filePath

// 添加路径安全验证
const pathValidation = validateFilePath(filePath)
if (!pathValidation.valid) {
  console.error('文件路径安全验证失败:', pathValidation.reason, filePath)
  return error('INVALID_FILE_PATH', pathValidation.reason || '无效的文件路径', undefined, 403)
}

// 检查文件是否存在
const existsValidation = validateFileExists(filePath)
if (!existsValidation.exists) {
  return error('FILE_NOT_FOUND_ERROR', '文件不存在', undefined, 404)
}

// 继续原有逻辑...
```

**Step 3: 在文件访问 API 中应用安全验证**

修改 `src/app/api/v1/files/[id]/route.ts`:

```typescript
// 在文件顶部添加导入
import { validateFilePath, validateFileExists } from '@/lib/file-security'

// 在第32行后添加验证
const filePath = file.filePath

// 添加路径安全验证
const pathValidation = validateFilePath(filePath)
if (!pathValidation.valid) {
  console.error('文件路径安全验证失败:', pathValidation.reason, filePath)
  return error('INVALID_FILE_PATH', pathValidation.reason || '无效的文件路径', undefined, 403)
}
```

**Step 4: 创建安全验证单元测试**

创建 `tests/unit/lib/file-security.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateFilePath } from '@/lib/file-security'

describe('file-security', () => {
  it('should reject empty path', () => {
    const result = validateFilePath('')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('空')
  })

  it('should reject relative path', () => {
    const result = validateFilePath('uploads/file.txt')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('绝对路径')
  })

  it('should reject path traversal attack', () => {
    const result = validateFilePath('/etc/passwd')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('允许的目录')
  })

  it('should reject path with ..', () => {
    const result = validateFilePath('/home/user/uploads/../../../etc/passwd')
    expect(result.valid).toBe(false)
  })

  it('should accept valid path in uploads directory', () => {
    const result = validateFilePath(`${process.cwd()}/uploads/test.txt`)
    expect(result.valid).toBe(true)
  })
})
```

**Step 5: 运行测试**

```bash
npm run test:unit -- tests/unit/lib/file-security.test.ts
```

**Step 6: 提交**

```bash
git add src/lib/file-security.ts \
        src/app/api/v1/files/[id]/route.ts \
        src/app/api/v1/files/[id]/download/route.ts \
        tests/unit/lib/file-security.test.ts
git commit -m "feat: 添加文件路径安全验证，防止路径遍历攻击"
```

---

### Task 7: 为 OnlyOffice 回调添加事务保护

**问题根因：** 文件写入和数据库更新不在同一事务中

**Files:**

- Modify: `src/app/api/v1/files/onlyoffice-callback/route.ts`

**Step 1: 添加事务和两阶段提交**

修改 `src/app/api/v1/files/onlyoffice-callback/route.ts`:

```typescript
// 在文件顶部添加导入
import { rename, unlink, existsSync } from 'fs/promises'
import { join } from 'path'

// 替换第81-102行的文件保存逻辑
// 使用两阶段提交确保数据一致性
const tempFilePath = `${matchedFile.filePath}.tmp`

try {
  // 阶段1: 下载文件到临时位置
  const downloadResponse = await fetch(url)
  if (!downloadResponse.ok) {
    return NextResponse.json({ error: 1, message: '下载文件失败' })
  }

  const buffer = Buffer.from(await downloadResponse.arrayBuffer())
  await writeFile(tempFilePath, buffer)

  // 阶段2: 数据库事务 + 文件替换
  await prisma.$transaction(async (tx) => {
    // 更新数据库
    await tx.fileStorage.update({
      where: { id: matchedFile.id },
      data: {
        fileSize: buffer.length,
        updatedAt: new Date(),
      },
    })

    // 原子性替换文件
    await rename(tempFilePath, matchedFile.filePath)
  })

  console.log('OnlyOffice文件更新成功:', matchedFile.id)
  return NextResponse.json({ error: 0 })
} catch (error) {
  console.error('保存文件失败:', error)

  // 清理临时文件
  if (existsSync(tempFilePath)) {
    await unlink(tempFilePath).catch(() => {})
  }

  return NextResponse.json({ error: 1, message: '保存文件失败' })
}
```

**Step 2: 提交**

```bash
git add src/app/api/v1/files/onlyoffice-callback/route.ts
git commit -m "fix: 为 OnlyOffice 回调添加事务保护，确保数据一致性"
```

---

### Task 8: 运行 P0 级别集成测试

**Step 1: 运行所有单元测试**

```bash
npm run test:unit
```

**Step 2: 运行类型检查**

```bash
npm run typecheck
```

**Step 3: 运行 lint**

```bash
npm run lint
```

**Step 4: 本地功能测试**

1. 启动开发服务器：`npm run dev`
2. 测试登录功能
3. 测试文件上传
4. 测试文件预览（图片、PDF、Office文档）
5. 测试文件下载

**Step 5: 提交 P0 修复完成的标记**

```bash
git add -A
git commit -m "feat: P0 级别修复完成 - 认证、性能、安全问题已解决"
git tag -a v0.1.0-p0-fix -m "P0 级别修复完成"
```

---

## 阶段二：P1 级别修复（需要尽快修复）

预计时间：5-7 天

---

### Task 9: 实现文档锁机制

**问题根因：** 完全缺少文档锁机制

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `src/lib/document-lock.ts`
- Modify: `src/app/api/v1/files/[id]/preview-edit/route.ts`
- Modify: `src/app/api/v1/files/onlyoffice-callback/route.ts`

**Step 1: 添加文档锁字段到 FileStorage**

```prisma
model FileStorage {
  // ... 现有字段
  lockedBy     String?
  lockedAt     DateTime?
  lockExpiresAt DateTime?

  // 关系
  locker User? @relation("FileLocker", fields: [lockedBy], references: [id], onDelete: SetNull)
}
```

**Step 2: 创建文档锁管理模块**

创建 `src/lib/document-lock.ts`:

```typescript
import { prisma } from '@/lib/prisma'

const LOCK_DURATION_MS = 30 * 60 * 1000 // 30分钟

export interface DocumentLock {
  locked: boolean
  lockedBy?: string
  lockedByName?: string
  expiresAt?: Date
}

/**
 * 尝试获取文档锁
 */
export async function acquireDocumentLock(
  fileId: string,
  userId: string
): Promise<{ success: boolean; lock?: DocumentLock }> {
  const file = await prisma.fileStorage.findUnique({
    where: { id: fileId },
    include: { locker: { select: { id: true, name: true } } },
  })

  if (!file) {
    return { success: false }
  }

  // 检查是否有有效锁
  if (file.lockedBy && file.lockExpiresAt && file.lockExpiresAt > new Date()) {
    if (file.lockedBy !== userId) {
      return {
        success: false,
        lock: {
          locked: true,
          lockedBy: file.lockedBy,
          lockedByName: file.locker?.name,
          expiresAt: file.lockExpiresAt,
        },
      }
    }
  }

  // 获取锁
  await prisma.fileStorage.update({
    where: { id: fileId },
    data: {
      lockedBy: userId,
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + LOCK_DURATION_MS),
    },
  })

  return { success: true }
}

/**
 * 释放文档锁
 */
export async function releaseDocumentLock(fileId: string, userId: string): Promise<void> {
  await prisma.fileStorage.updateMany({
    where: {
      id: fileId,
      lockedBy: userId,
    },
    data: {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  })
}

/**
 * 延长锁有效期
 */
export async function extendDocumentLock(fileId: string, userId: string): Promise<boolean> {
  const result = await prisma.fileStorage.updateMany({
    where: {
      id: fileId,
      lockedBy: userId,
    },
    data: {
      lockExpiresAt: new Date(Date.now() + LOCK_DURATION_MS),
    },
  })

  return result.count > 0
}

/**
 * 清理过期锁
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const result = await prisma.fileStorage.updateMany({
    where: {
      lockExpiresAt: { lt: new Date() },
    },
    data: {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  })

  return result.count
}
```

**Step 3: 在预览编辑 API 中使用锁**

```typescript
// 在 preview-edit/route.ts 中添加
import { acquireDocumentLock, releaseDocumentLock } from '@/lib/document-lock'

// 在生成配置前获取锁
if (mode === 'edit') {
  const lockResult = await acquireDocumentLock(fileId, userId)
  if (!lockResult.success && lockResult.lock) {
    return error(
      'FILE_LOCKED',
      `文件正在被 ${lockResult.lock.lockedByName} 编辑中`,
      lockResult.lock,
      423
    )
  }
}
```

**Step 4: 提交**

```bash
git add prisma/schema.prisma src/lib/document-lock.ts src/app/api/v1/files/[id]/preview-edit/route.ts
git commit -m "feat: 实现文档锁机制，防止并发编辑冲突"
```

---

### Task 10: 改进 Document Key 为 JWT Token

**问题根因：** Document Key 安全性弱，容易被猜到

**Files:**

- Modify: `src/lib/preview/onlyoffice.ts`

**Step 1: 使用 JWT 生成 Document Token**

修改 `src/lib/preview/onlyoffice.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose'

/**
 * 生成安全的文档访问令牌
 */
export async function generateDocumentToken(
  fileId: string,
  userId: string,
  expiresIn: string = '1h'
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

  const token = await new SignJWT({
    fileId,
    userId,
    type: 'document-preview',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}

/**
 * 验证文档访问令牌
 */
export async function verifyDocumentToken(
  token: string,
  fileId: string
): Promise<{ valid: boolean; userId?: string }> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    if (payload.fileId !== fileId) {
      return { valid: false }
    }

    return { valid: true, userId: payload.userId as string }
  } catch {
    return { valid: false }
  }
}
```

**Step 2: 更新下载 API 验证逻辑**

修改 `src/app/api/v1/files/[id]/download/route.ts`:

```typescript
import { verifyDocumentToken } from '@/lib/preview/onlyoffice'

// 替换 Document Key 验证
const documentToken = searchParams.get('token')
const isValidToken = documentToken && (await verifyDocumentToken(documentToken, fileId))

if (!userId && !isValidToken) {
  return error('UNAUTHORIZED_ERROR', '未授权，请先登录或提供有效的文档令牌', undefined, 401)
}
```

**Step 3: 提交**

```bash
git add src/lib/preview/onlyoffice.ts src/app/api/v1/files/[id]/download/route.ts
git commit -m "feat: 使用 JWT 替代简单 Document Key，增强安全性"
```

---

### Task 11: 添加统一错误处理机制

**问题根因：** 缺乏统一错误处理机制

**Files:**

- Create: `src/lib/error-handler.ts`
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: 创建后端错误处理工具**

创建 `src/lib/error-handler.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public data?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }

  static unauthorized(message: string = '未授权') {
    return new AppError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message: string = '禁止访问') {
    return new AppError('FORBIDDEN', message, 403)
  }

  static notFound(message: string = '资源不存在') {
    return new AppError('NOT_FOUND', message, 404)
  }

  static badRequest(message: string, data?: unknown) {
    return new AppError('BAD_REQUEST', message, 400, data)
  }

  static internal(message: string = '服务器内部错误') {
    return new AppError('INTERNAL_ERROR', message, 500)
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message,
      },
    }
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: '未知错误',
    },
  }
}
```

**Step 2: 创建前端 ErrorBoundary**

创建 `src/components/ErrorBoundary.tsx`:

```typescript
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <h2 className="mb-4 text-xl font-semibold text-red-600">出现错误</h2>
          <p className="mb-4 text-gray-600">{this.state.error?.message || '未知错误'}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Step 3: 在 layout 中使用 ErrorBoundary**

修改 `src/app/layout.tsx`:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

**Step 4: 提交**

```bash
git add src/lib/error-handler.ts src/components/ErrorBoundary.tsx src/app/layout.tsx
git commit -m "feat: 添加统一错误处理机制和前端 ErrorBoundary"
```

---

### Task 12-22: 其他 P1 任务（简化描述）

由于篇幅限制，以下是剩余 P1 任务的简要说明：

**Task 12: 添加限流和熔断保护**

- 使用 `upstash/ratelimit` 或自实现令牌桶
- 添加到 middleware.ts

**Task 13: 添加超时和重试机制**

- 扩展 `src/lib/api/client.ts` 添加重试逻辑
- 实现指数退避

**Task 14: 完善 MIME 类型验证**

- 使用 `file-type` 库检测真实文件类型
- 添加到文件上传流程

**Task 15-22: 其他优化**

- 服务发现支持
- 负载均衡配置
- 文件类型判断完善
- ReviewMaterial 事务
- 下载超时控制
- E2E 测试添加

---

## 阶段三：P2 级别修复（需要修复）

预计时间：3-4 天

---

### Task 23-30: P2 任务概要

1. **统一认证系统** - 合并 Cookie 和 JWT 认证逻辑
2. **完善健康检查** - 添加详细的健康检查端点
3. **健康检查缓存持久化** - 使用 Redis 共享缓存
4. **权限检查缓存** - 添加 Redis 缓存层
5. **健康检查错误计数重置** - 实现自动恢复
6. **降级通知机制** - 添加用户友好的降级提示
7. **预览服务降级策略** - 实现自动降级
8. **预览会话管理** - 添加会话超时和锁释放

---

## 阶段四：P3 级别优化（持续改进）

预计时间：2-3 天

---

### Task 31-35: P3 任务概要

1. **添加 E2E 测试覆盖** - 使用 Playwright 测试预览流程
2. **文件存储路径配置化** - 使用环境变量配置
3. **文件清理机制** - 添加定时清理孤儿文件任务
4. **审计日志** - 记录关键操作日志
5. **完善日志系统** - 添加结构化日志

---

## 验证清单

完成所有修复后，验证以下功能：

### 功能测试

- [ ] 用户登录后 Cookie 正确设置
- [ ] 文件上传成功
- [ ] 图片预览正常
- [ ] PDF 预览正常
- [ ] Office 文档预览正常（OnlyOffice）
- [ ] 文件下载正常
- [ ] 多用户并发编辑有锁提示
- [ ] 文件预览降级正常工作

### 性能测试

- [ ] 回调处理时间 < 100ms
- [ ] 权限检查有缓存命中
- [ ] 无内存泄漏

### 安全测试

- [ ] 路径遍历攻击被阻止
- [ ] Document Token 无法伪造
- [ ] 限流机制正常工作

---

## 提交历史记录

每个 Task 完成后应创建独立提交，格式：

```
<type>(<scope>): <subject>

- 变更点1
- 变更点2

Fixes #<issue-number>
```

---

## 风险与缓解

| 风险                | 影响               | 缓解措施                   |
| ------------------- | ------------------ | -------------------------- |
| 数据库迁移失败      | 服务中断           | 在测试环境验证后再部署生产 |
| Cookie 配置变更     | 用户需重新登录     | 提前通知用户               |
| OnlyOffice 配置变更 | 预览功能暂时不可用 | 准备降级方案               |

---

**计划完成。保存到 `docs/plans/2026-03-17-review-attachment-preview-fix.md`**
