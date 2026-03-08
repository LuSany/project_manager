import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'
import { z } from 'zod'

// 关联任务验证Schema
const linkTaskSchema = z.object({
  taskId: z.string(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: milestoneId } = await params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: { members: true },
        },
      },
    })

    if (!milestone) {
      return ApiResponder.notFound('里程碑不存在')
    }

    const isOwner = milestone.project.ownerId === user.id
    const isMember = milestone.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此里程碑')
    }

    const where: any = { milestoneId }
    if (status) {
      where.status = status
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
          _count: { select: { subTasks: true, taskTags: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      prisma.task.count({ where }),
    ])

    return ApiResponder.success({
      data: tasks,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取里程碑任务列表失败:', error)
    return ApiResponder.serverError('获取里程碑任务列表失败')
  }
}

// POST - 关联任务到里程碑
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: milestoneId } = await params
    const body = await req.json()
    const validatedData = linkTaskSchema.parse(body)

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: { members: true },
        },
      },
    })

    if (!milestone) {
      return ApiResponder.notFound('里程碑不存在')
    }

    const isOwner = milestone.project.ownerId === user.id
    const isMember = milestone.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权操作此里程碑')
    }

    // 验证任务存在且属于同一项目
    const task = await prisma.task.findUnique({
      where: { id: validatedData.taskId },
    })

    if (!task) {
      return ApiResponder.notFound('任务不存在')
    }

    if (task.projectId !== milestone.projectId) {
      return ApiResponder.error('任务不属于此里程碑所在项目', 400)
    }

    // 更新任务的milestoneId
    const updatedTask = await prisma.task.update({
      where: { id: validatedData.taskId },
      data: { milestoneId },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    return ApiResponder.success(updatedTask, '任务已关联到里程碑')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('数据验证失败', error.issues as any)
    }
    console.error('关联任务失败:', error)
    return ApiResponder.serverError('关联任务失败')
  }
}

// DELETE - 取消任务与里程碑的关联
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: milestoneId } = await params
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return ApiResponder.error('缺少任务ID', 400)
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: { members: true },
        },
      },
    })

    if (!milestone) {
      return ApiResponder.notFound('里程碑不存在')
    }

    const isOwner = milestone.project.ownerId === user.id
    const isMember = milestone.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权操作此里程碑')
    }

    // 取消任务与里程碑的关联
    await prisma.task.update({
      where: { id: taskId },
      data: { milestoneId: null },
    })

    return ApiResponder.success(null, '已取消任务与里程碑的关联')
  } catch (error) {
    console.error('取消关联失败:', error)
    return ApiResponder.serverError('取消关联失败')
  }
}
