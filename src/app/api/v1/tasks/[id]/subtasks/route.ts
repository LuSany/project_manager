import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

// 子任务创建验证 Schema
const createSubTaskSchema = z.object({
  title: z.string().min(1, '子任务标题不能为空'),
  description: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
})

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

// GET /api/v1/tasks/[id]/subtasks - 获取子任务列表
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  const { id } = await params

  try {
    const task = await prisma.tasks.findUnique({
      where: { id },
      include: {
        task_assignees: { select: { userId: true } },
        projects: { select: { ownerId: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    const isAssignee = task.task_assignees.some((a) => a.userId === user.id)
    const isProjectOwner = task.projects?.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    const projectMember = await prisma.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: user.id,
        },
      },
    })

    if (!isAssignee && !isProjectOwner && !projectMember && !isAdmin) {
      return NextResponse.json({ success: false, error: '无权访问此任务' }, { status: 403 })
    }

    const subtasks = await prisma.subtasks.findMany({
      where: {
        taskId: id,
        parentId: null,
      },
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
        other_subtasks: {
          include: {
            users: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      } as any,
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: subtasks,
    })
  } catch (error) {
    console.error('获取子任务列表失败:', error)
    return NextResponse.json({ success: false, error: '获取子任务列表失败' }, { status: 500 })
  }
}

// POST /api/v1/tasks/[id]/subtasks - 创建子任务
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const validatedData = createSubTaskSchema.parse(body)

    const task = await prisma.tasks.findUnique({
      where: { id },
      include: {
        task_assignees: { select: { userId: true } },
        projects: { select: { ownerId: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    const isAssignee = task.task_assignees.some((a) => a.userId === user.id)
    const isProjectOwner = task.projects?.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    const projectMember = await prisma.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: user.id,
        },
      },
    })

    if (!isAssignee && !isProjectOwner && !projectMember && !isAdmin) {
      return NextResponse.json({ success: false, error: '无权访问此任务' }, { status: 403 })
    }

    const subTask = await prisma.subtasks.create({
      data: {
        id: crypto.randomUUID(),
        title: validatedData.title,
        description: validatedData.description,
        taskId: id,
        assigneeId:
          validatedData.assigneeId && validatedData.assigneeId !== '__unassigned__'
            ? validatedData.assigneeId
            : null,
        updatedAt: new Date(),
      } as any,
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: subTask,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('创建子任务失败:', error)
    return NextResponse.json({ success: false, error: '创建子任务失败' }, { status: 500 })
  }
}
