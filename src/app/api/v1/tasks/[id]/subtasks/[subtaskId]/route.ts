import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateSubTaskSchema = z.object({
  title: z.string().min(1, '子任务标题不能为空').optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  assigneeId: z.string().optional().nullable(),
})

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  const { id: taskId, subtaskId } = await params

  try {
    const body = await request.json()
    const validatedData = updateSubTaskSchema.parse(body)

    const task = await db.tasks.findUnique({
      where: { id: taskId },
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

    const projectMember = await db.project_members.findUnique({
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

    const updatedSubtask = await db.subtasks.update({
      where: { id: subtaskId },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.completed !== undefined && { completed: validatedData.completed }),
        ...(validatedData.assigneeId !== undefined && { assigneeId: validatedData.assigneeId }),
        updatedAt: new Date(),
      } as any,
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
      } as any,
    })

    return NextResponse.json({
      success: true,
      data: updatedSubtask,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('更新子任务失败:', error)
    return NextResponse.json({ success: false, error: '更新子任务失败' }, { status: 500 })
  }
}
