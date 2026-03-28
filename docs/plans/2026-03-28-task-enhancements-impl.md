# 任务功能增强实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现评论持久化、子任务负责人、任务验收流程三个功能

**Architecture:** 基于现有 Prisma ORM 和 Next.js API Routes，扩展数据模型并添加新的 API 端点和 UI 组件

**Tech Stack:** Prisma 6.x, Next.js 15.x, TanStack Query 5.x, Zustand 5.x

---

## Phase 1: 评论持久化

### Task 1.1: 创建 task_comments Prisma 模型

**Files:**

- Modify: `prisma/schema.prisma` (在 `task_tags` 模型后添加)

**Step 1: 添加 task_comments 模型到 Prisma schema**

在 `prisma/schema.prisma` 中 `task_tags` 模型后添加：

```prisma
model task_comments {
  id        String   @id
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime
  tasks     tasks    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  users     users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([userId])
}
```

同时需要在 `tasks` 模型中添加关系：

```prisma
task_comments task_comments[]
```

以及在 `users` 模型中添加关系：

```prisma
task_comments task_comments[]
```

**Step 2: 生成 Prisma 客户端**

Run: `npm run db:generate`
Expected: Prisma client generated successfully

**Step 3: 运行数据库迁移**

Run: `npm run db:migrate -- --name add_task_comments`
Expected: Migration applied successfully

**Step 4: 验证迁移**

Run: `npx prisma studio` (打开 Prisma Studio 查看新表)
Expected: task_comments 表存在

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): 添加 task_comments 模型支持评论持久化"
```

---

### Task 1.2: 更新评论 API

**Files:**

- Modify: `src/app/api/v1/tasks/[id]/comments/route.ts`
- Create: `src/app/api/v1/tasks/[id]/comments/[commentId]/route.ts`

**Step 1: 修改 GET 方法获取真实评论数据**

修改 `src/app/api/v1/tasks/[id]/comments/route.ts`:

```typescript
// GET: 获取任务的评论列表
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params

  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    // 检查任务是否存在
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    // 从数据库获取评论
    const comments = await db.task_comments.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: comments,
    })
  } catch (error) {
    console.error('获取评论列表失败:', error)
    return NextResponse.json({ success: false, error: '获取评论列表失败' }, { status: 500 })
  }
}
```

**Step 2: 修改 POST 方法保存评论到数据库**

修改同一文件的 POST 方法：

```typescript
// POST: 创建新评论
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params

  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: '评论内容不能为空' }, { status: 400 })
    }

    // 检查任务是否存在
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    // 保存评论到数据库
    const commentId = crypto.randomUUID()
    const newComment = await db.task_comments.create({
      data: {
        id: commentId,
        taskId,
        userId: user.id,
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: newComment,
    })
  } catch (error) {
    console.error('创建评论失败:', error)
    return NextResponse.json({ success: false, error: '创建评论失败' }, { status: 500 })
  }
}
```

**Step 3: 创建删除评论 API**

创建 `src/app/api/v1/tasks/[id]/comments/[commentId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

// DELETE: 删除评论
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: taskId, commentId } = await context.params

  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    // 检查评论是否存在
    const comment = await db.task_comments.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, taskId: true },
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: '评论不存在' }, { status: 404 })
    }

    // 验证评论属于该任务
    if (comment.taskId !== taskId) {
      return NextResponse.json({ success: false, error: '评论不属于该任务' }, { status: 400 })
    }

    // 权限检查：仅作者可删除自己的评论
    if (comment.userId !== user.id) {
      return NextResponse.json({ success: false, error: '无权限删除此评论' }, { status: 403 })
    }

    // 删除评论
    await db.task_comments.delete({
      where: { id: commentId },
    })

    return NextResponse.json({
      success: true,
      data: null,
    })
  } catch (error) {
    console.error('删除评论失败:', error)
    return NextResponse.json({ success: false, error: '删除评论失败' }, { status: 500 })
  }
}
```

**Step 4: 验证 API**

Run: `npm run dev`
手动测试：

- GET `/api/v1/tasks/[id]/comments` 应返回评论列表
- POST `/api/v1/tasks/[id]/comments` 应创建评论
- DELETE `/api/v1/tasks/[id]/comments/[commentId]` 应删除评论

**Step 5: Commit**

```bash
git add src/app/api/v1/tasks/[id]/comments/
git commit -m "feat(api): 评论 API 持久化实现"
```

---

### Task 1.3: 改造 CommentsTab UI

**Files:**

- Modify: `src/components/tasks/detail/CommentsTab.tsx`

**Step 1: 添加删除评论功能**

修改 CommentsTab，添加删除按钮和删除 mutation：

```typescript
// 在 API 函数部分添加
async function deleteComment(
  taskId: string,
  commentId: string
): Promise<void> {
  const response = await fetch(
    `/api/v1/tasks/${taskId}/comments/${commentId}`,
    { method: "DELETE" }
  );
  const data: ApiResponse<null> = await response.json();
  if (!data.success) {
    throw new Error(data.error || "删除评论失败");
  }
}

// 在组件中添加删除 mutation
const deleteMutation = useMutation({
  mutationFn: (commentId: string) => deleteComment(taskId, commentId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
  },
});

// 在评论项中添加删除按钮（仅作者可见）
{comment.userId === currentUserId && (
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6"
    onClick={() => deleteMutation.mutate(comment.id)}
    disabled={deleteMutation.isPending}
  >
    <Trash2 className="h-3 w-3" />
  </Button>
)}
```

**Step 2: 移除预览状态提示**

删除 CommentsTab 中的"预览状态"提示文本。

**Step 3: 验证 UI**

手动测试：

- 评论应正确显示
- 仅作者可见删除按钮
- 删除后评论消失

**Step 4: Commit**

```bash
git add src/components/tasks/detail/CommentsTab.tsx
git commit -m "feat(ui): 评论组件支持删除功能，移除预览提示"
```

---

## Phase 2: 子任务负责人

### Task 2.1: 修改 subtasks Prisma 模型

**Files:**

- Modify: `prisma/schema.prisma` (subtasks 模型)

**Step 1: 添加 assigneeId 字段到 subtasks 模型**

修改 `prisma/schema.prisma` 中 subtasks 模型：

```prisma
model subtasks {
  id          String     @id
  title       String
  description String?
  completed   Boolean    @default(false)
  taskId      String
  assigneeId  String?    // 新增
  parentId    String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime
  users       users?     @relation(fields: [assigneeId], references: [id]) // 新增
  subtasks    subtasks?  @relation("subtasksTosubtasks", fields: [parentId], references: [id], onDelete: Cascade)
  other_subtasks subtasks[] @relation("subtasksTosubtasks")
  tasks       tasks      @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([assigneeId]) // 新增
  @@index([completed])
  @@index([parentId])
  @@index([taskId])
}
```

同时在 users 模型添加关系（如果不存在）：

```prisma
subtasks subtasks[]  // 在 users 模型中添加
```

**Step 2: 生成 Prisma 客户端**

Run: `npm run db:generate`

**Step 3: 运行数据库迁移**

Run: `npm run db:migrate -- --name add_subtask_assignee`

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): 子任务支持负责人字段"
```

---

### Task 2.2: 更新子任务 API

**Files:**

- Modify: `src/app/api/v1/tasks/[id]/subtasks/route.ts`
- Modify: `src/app/api/v1/tasks/[id]/subtasks/[subtaskId]/route.ts` (如果存在)

**Step 1: 修改 POST 方法支持 assigneeId**

在创建子任务时接受 assigneeId 参数：

```typescript
// 在 POST 方法中
const body = await request.json()
const { title, description, assigneeId } = body

// 创建子任务
const subtask = await db.subtasks.create({
  data: {
    id: subtaskId,
    title,
    description: description || null,
    assigneeId: assigneeId || null, // 新增
    taskId,
    updatedAt: new Date(),
  },
  include: {
    users: assigneeId
      ? {
          select: { id: true, name: true, avatar: true },
        }
      : false,
  },
})
```

**Step 2: 修改 GET 方法返回负责人信息**

```typescript
const subtasks = await db.subtasks.findMany({
  where: { taskId, parentId: null },
  include: {
    users: {
      // 新增
      select: { id: true, name: true, avatar: true },
    },
    other_subtasks: {
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
      },
    },
  },
  orderBy: { createdAt: 'asc' },
})
```

**Step 3: 添加 PUT 方法更新 assigneeId**

如果需要单独更新子任务，添加 PUT 方法：

```typescript
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const { id: taskId, subtaskId } = await context.params
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, completed, assigneeId } = body

  const updatedSubtask = await db.subtasks.update({
    where: { id: subtaskId },
    data: {
      title,
      description,
      completed,
      assigneeId, // 新增
      updatedAt: new Date(),
    },
    include: {
      users: {
        select: { id: true, name: true, avatar: true },
      },
    },
  })

  return NextResponse.json({ success: true, data: updatedSubtask })
}
```

**Step 4: Commit**

```bash
git add src/app/api/v1/tasks/[id]/subtasks/
git commit -m "feat(api): 子任务 API 支持负责人"
```

---

### Task 2.3: 改造 SubTaskList UI

**Files:**

- Modify: `src/components/tasks/SubTaskList.tsx`

**Step 1: 添加负责人选择器**

在添加子任务区域添加负责人下拉框：

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// 添加状态
const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

// 获取项目成员列表（需要添加 props 或通过 API 获取）
// 假设通过 props 传入
interface SubTaskListProps {
  taskId: string;
  projectId: string; // 新增
}

// 在添加输入框后添加负责人选择
<Select value={selectedAssignee || ""} onValueChange={(v) => setSelectedAssignee(v || null)}>
  <SelectTrigger className="w-[150px]">
    <SelectValue placeholder="选择负责人" />
  </SelectTrigger>
  <SelectContent>
    {projectMembers.map((member) => (
      <SelectItem key={member.userId} value={member.userId}>
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={member.users.avatar} />
            <AvatarFallback>{member.users.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span>{member.users.name}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Step 2: 修改创建逻辑传递 assigneeId**

```typescript
const handleAddSubTask = async () => {
  if (!newTaskTitle.trim()) return
  setIsAdding(true)
  try {
    await createMutation.mutateAsync({
      title: newTaskTitle,
      assigneeId: selectedAssignee, // 新增
    })
    setNewTaskTitle('')
    setSelectedAssignee(null) // 重置
  } catch (error) {
    console.error('添加子任务失败:', error)
  } finally {
    setIsAdding(false)
  }
}
```

**Step 3: 显示负责人信息**

在子任务项中显示负责人：

```typescript
{subTask.users && (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Avatar className="h-4 w-4">
      <AvatarImage src={subTask.users.avatar} />
      <AvatarFallback>{subTask.users.name.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <span>{subTask.users.name}</span>
  </div>
)}
```

**Step 4: Commit**

```bash
git add src/components/tasks/SubTaskList.tsx
git commit -m "feat(ui): 子任务组件支持选择和显示负责人"
```

---

## Phase 3: 任务验收流程

### Task 3.1: 创建 task_acceptances Prisma 模型

**Files:**

- Modify: `prisma/schema.prisma`

**Step 1: 添加 task_acceptances 模型**

```prisma
model task_acceptances {
  id          String           @id
  taskId      String
  acceptorId  String
  requesterId String
  result      AcceptanceResult @default(PENDING)
  notes       String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime
  tasks       tasks            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  users_task_acceptances_acceptorIdTousers   users @relation("acceptorIdToUsers", fields: [acceptorId], references: [id])
  users_task_acceptances_requesterIdTousers  users @relation("requesterIdToUsers", fields: [requesterId], references: [id])

  @@index([taskId])
  @@index([acceptorId])
  @@index([result])
}
```

在 tasks 模型添加关系：

```prisma
task_acceptances task_acceptances[]
```

在 users 模型添加关系：

```prisma
task_acceptances task_acceptances[] @relation("acceptorIdToUsers")
task_acceptances task_acceptances[] @relation("requesterIdToUsers")
```

**Step 2: 生成和迁移**

Run: `npm run db:generate && npm run db:migrate -- --name add_task_acceptances`

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): 添加任务验收记录模型"
```

---

### Task 3.2: 创建验收 API

**Files:**

- Create: `src/app/api/v1/tasks/[id]/acceptance/route.ts`

**Step 1: 创建验收 API 文件**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

// GET: 获取验收记录
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
  }

  const acceptances = await db.task_acceptances.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    include: {
      users_task_acceptances_acceptorIdTousers: {
        select: { id: true, name: true, avatar: true },
      },
      users_task_acceptances_requesterIdTousers: {
        select: { id: true, name: true, avatar: true },
      },
    },
  })

  return NextResponse.json({ success: true, data: acceptances })
}

// POST: 发起验收
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
  }

  const body = await request.json()
  const { acceptorId } = body

  if (!acceptorId) {
    return NextResponse.json({ success: false, error: '请选择验收人' }, { status: 400 })
  }

  // 检查任务状态
  const task = await db.tasks.findUnique({
    where: { id: taskId },
    select: { id: true, status: true, progress: true },
  })

  if (!task) {
    return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
  }

  if (task.status === 'REVIEW' || task.status === 'DONE' || task.status === 'CANCELLED') {
    return NextResponse.json({ success: false, error: '任务状态不允许发起验收' }, { status: 400 })
  }

  // 创建验收记录并更新任务状态
  const acceptanceId = crypto.randomUUID()
  const acceptance = await db.task_acceptances.create({
    data: {
      id: acceptanceId,
      taskId,
      acceptorId,
      requesterId: user.id,
      updatedAt: new Date(),
    },
  })

  // 更新任务状态为 REVIEW
  await db.tasks.update({
    where: { id: taskId },
    data: { status: 'REVIEW', updatedAt: new Date() },
  })

  return NextResponse.json({ success: true, data: acceptance })
}

// PUT: 验收通过或不通过
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
  }

  const body = await request.json()
  const { result, notes } = body

  if (!result || (result !== 'PASSED' && result !== 'FAILED')) {
    return NextResponse.json({ success: false, error: '请选择验收结果' }, { status: 400 })
  }

  // 查找当前待处理的验收记录
  const pendingAcceptance = await db.task_acceptances.findFirst({
    where: { taskId, result: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!pendingAcceptance) {
    return NextResponse.json({ success: false, error: '无待处理的验收记录' }, { status: 404 })
  }

  // 权限检查：验收人才能操作
  if (pendingAcceptance.acceptorId !== user.id) {
    return NextResponse.json({ success: false, error: '无权限进行验收' }, { status: 403 })
  }

  // 更新验收记录
  const updatedAcceptance = await db.task_acceptances.update({
    where: { id: pendingAcceptance.id },
    data: {
      result,
      notes,
      updatedAt: new Date(),
    },
  })

  // 更新任务状态
  const newStatus = result === 'PASSED' ? 'DONE' : 'IN_PROGRESS'
  const updateData: any = {
    status: newStatus,
    updatedAt: new Date(),
  }

  if (result === 'PASSED') {
    updateData.completedAt = new Date()
  }

  await db.tasks.update({
    where: { id: taskId },
    data: updateData,
  })

  return NextResponse.json({ success: true, data: updatedAcceptance })
}
```

**Step 2: Commit**

```bash
git add src/app/api/v1/tasks/[id]/acceptance/route.ts
git commit -m "feat(api): 任务验收 API 实现"
```

---

### Task 3.3: 改造 DetailTab UI

**Files:**

- Modify: `src/components/tasks/detail/DetailTab.tsx`
- Create: `src/components/tasks/detail/AcceptancePanel.tsx`
- Create: `src/components/tasks/detail/AcceptanceHistory.tsx`

**Step 1: 创建 AcceptancePanel 组件**

```typescript
"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface AcceptancePanelProps {
  taskId: string;
  acceptorId: string;
  currentUserId: string;
}

export function AcceptancePanel({ taskId, acceptorId, currentUserId }: AcceptancePanelProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = React.useState("");

  // 仅验收人可见
  if (acceptorId !== currentUserId) {
    return null;
  }

  const acceptMutation = useMutation({
    mutationFn: (result: "PASSED" | "FAILED") =>
      fetch(`/api/v1/tasks/${taskId}/acceptance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, notes }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["acceptances", taskId] });
    },
  });

  const handleAccept = (result: "PASSED" | "FAILED") => {
    if (result === "FAILED" && !notes.trim()) {
      alert("验收不通过时请填写意见");
      return;
    }
    acceptMutation.mutate(result);
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-lg text-orange-700">验收操作</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="验收意见（不通过时必填）..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAccept("PASSED")}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            验收通过
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAccept("FAILED")}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            验收不通过
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: 创建 AcceptanceHistory 组件**

```typescript
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface AcceptanceHistoryProps {
  taskId: string;
}

export function AcceptanceHistory({ taskId }: AcceptanceHistoryProps) {
  const { data: acceptances = [], isLoading } = useQuery({
    queryKey: ["acceptances", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tasks/${taskId}/acceptance`);
      return res.json();
    },
  });

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (acceptances.length === 0) {
    return null;
  }

  const getResultIcon = (result: string) => {
    if (result === "PASSED") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (result === "FAILED") return <XCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-orange-600" />;
  };

  const getResultBadge = (result: string) => {
    if (result === "PASSED") return <Badge className="bg-green-100 text-green-700">通过</Badge>;
    if (result === "FAILED") return <Badge className="bg-red-100 text-red-700">不通过</Badge>;
    return <Badge className="bg-orange-100 text-orange-700">待验收</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">验收记录</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {acceptances.map((acc: any) => (
            <div key={acc.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                {getResultIcon(acc.result)}
                {getResultBadge(acc.result)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={acc.users_task_acceptances_requesterIdTousers?.avatar} />
                    <AvatarFallback>{acc.users_task_acceptances_requesterIdTousers?.name?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{acc.users_task_acceptances_requesterIdTousers?.name}</span>
                  <span className="text-muted-foreground">发起验收</span>
                  <span className="text-muted-foreground">→</span>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={acc.users_task_acceptances_acceptorIdTousers?.avatar} />
                    <AvatarFallback>{acc.users_task_acceptances_acceptorIdTousers?.name?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{acc.users_task_acceptances_acceptorIdTousers?.name}</span>
                </div>
                {acc.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{acc.notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(acc.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: 在 DetailTab 中添加发起验收按钮**

在进度区域添加：

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 在组件中
const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false);
const [selectedAcceptor, setSelectedAcceptor] = useState<string | null>(null);

// 发起验收条件
const canRequestAcceptance =
  task.progress === 100 &&
  task.status !== "REVIEW" &&
  task.status !== "DONE" &&
  task.status !== "CANCELLED";

// 发起验收 mutation
const requestAcceptanceMutation = useMutation({
  mutationFn: (acceptorId: string) =>
    fetch(`/api/v1/tasks/${taskId}/acceptance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptorId }),
    }).then((r) => r.json()),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    setShowAcceptanceDialog(false);
  },
});

// 在进度区域后添加
{canRequestAcceptance && (
  <Dialog open={showAcceptanceDialog} onOpenChange={setShowAcceptanceDialog}>
    <DialogTrigger asChild>
      <Button variant="outline" className="w-full mt-2">
        <CheckCircle2 className="h-4 w-4 mr-2" />
        发起验收
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>发起验收</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Select value={selectedAcceptor || ""} onValueChange={setSelectedAcceptor}>
          <SelectTrigger>
            <SelectValue placeholder="选择验收人" />
          </SelectTrigger>
          <SelectContent>
            {projectMembers.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.users.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => selectedAcceptor && requestAcceptanceMutation.mutate(selectedAcceptor)}
          disabled={!selectedAcceptor || requestAcceptanceMutation.isPending}
        >
          {requestAcceptanceMutation.isPending ? "提交中..." : "提交验收请求"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}

// 验收面板（状态为 REVIEW 时显示）
{task.status === "REVIEW" && pendingAcceptance && (
  <AcceptancePanel
    taskId={taskId}
    acceptorId={pendingAcceptance.acceptorId}
    currentUserId={currentUserId}
  />
)}

// 验收历史
<AcceptanceHistory taskId={taskId} />
```

**Step 4: Commit**

```bash
git add src/components/tasks/detail/
git commit -m "feat(ui): 任务验收流程 UI 实现"
```

---

## Phase 4: 集成测试

### Task 4.1: 运行类型检查

**Step 1: TypeScript 检查**

Run: `npm run typecheck`
Expected: No errors

**Step 2: ESLint 检查**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit (如果有修复)**

```bash
git add -A
git commit -m "fix: 修复类型和 lint 错误"
```

---

### Task 4.2: 手动集成测试

**测试场景：**

1. **评论持久化测试**
   - 打开任务详情 → 评论 Tab
   - 输入评论 → 提交 → 评论显示在列表中
   - 删除评论 → 评论消失
   - 刷新页面 → 评论仍然存在

2. **子任务负责人测试**
   - 打开任务详情 → 子任务 Tab
   - 创建子任务 → 选择负责人 → 提交
   - 子任务显示负责人头像和姓名
   - 刷新页面 → 负责人信息仍然存在

3. **验收流程测试**
   - 设置任务进度为 100%
   - 点击"发起验收" → 选择验收人 → 提交
   - 任务状态变为 REVIEW
   - 作为验收人登录 → 看到验收面板
   - 验收通过 → 任务状态变为 DONE
   - 或验收不通过 → 任务状态变为 IN_PROGRESS，显示不通过原因

---

## 文件清单汇总

### 需要修改的文件

| 文件                                          | 改动                                                     |
| --------------------------------------------- | -------------------------------------------------------- |
| `prisma/schema.prisma`                        | 添加 task_comments、修改 subtasks、添加 task_acceptances |
| `src/app/api/v1/tasks/[id]/comments/route.ts` | 评论 API 持久化                                          |
| `src/components/tasks/detail/CommentsTab.tsx` | 添加删除功能，移除预览提示                               |
| `src/components/tasks/SubTaskList.tsx`        | 添加负责人选择和显示                                     |
| `src/components/tasks/detail/DetailTab.tsx`   | 添加验收 UI                                              |

### 需要新建的文件

| 文件                                                      | 功能         |
| --------------------------------------------------------- | ------------ |
| `src/app/api/v1/tasks/[id]/comments/[commentId]/route.ts` | 删除评论 API |
| `src/app/api/v1/tasks/[id]/acceptance/route.ts`           | 验收 API     |
| `src/components/tasks/detail/AcceptancePanel.tsx`         | 验收操作面板 |
| `src/components/tasks/detail/AcceptanceHistory.tsx`       | 验收记录展示 |

---

## 实现顺序建议

1. **Phase 1** (评论持久化) - 最简单，独立，无依赖
2. **Phase 2** (子任务负责人) - 中等复杂度，独立
3. **Phase 3** (验收流程) - 最复杂，依赖任务状态逻辑
4. **Phase 4** (集成测试) - 验证所有功能正常工作
