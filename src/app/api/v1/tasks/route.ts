import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyTaskAssigned } from '@/lib/notification'
import { getAuthUser, getUserProjectIds } from '@/lib/auth-helpers'
import { ApiResponder } from '@/lib/api/response'
import { MAX_PAGE_SIZE } from '@/lib/constants'

// 任务创建验证 Schema
const createTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE']).optional(),
  progress: z.number().min(0).max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().optional(), // 接受日期字符串如 "2026-03-28"
  dueDate: z.string().optional(), // 接受日期字符串如 "2026-03-28"
  estimatedHours: z.number().positive().optional(),
  projectId: z.string(),
  milestoneId: z.string().optional(),
  issueId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
})

// GET /api/v1/tasks - 获取任务列表
export async function GET(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), MAX_PAGE_SIZE)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const milestoneId = searchParams.get('milestoneId')
    const issueId = searchParams.get('issueId')

    const skip = (page - 1) * pageSize

    const where: any = {}

    // 权限过滤：非管理员只能看到自己有权限的项目任务
    if (user.role !== 'ADMIN') {
      const projectIds = await getUserProjectIds(user.id)

      if (projectId) {
        // 检查用户是否有权限访问该项目
        if (!projectIds.includes(projectId)) {
          return ApiResponder.forbidden('无权访问此项目')
        }
        where.projectId = projectId
      } else {
        // 未指定项目时，只显示用户有权限的项目任务
        if (projectIds.length === 0) {
          return ApiResponder.paginated([], {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          })
        }
        where.projectId = { in: projectIds }
      }
    } else {
      // 管理员可以看到所有任务
      if (projectId) {
        where.projectId = projectId
      }
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (milestoneId) {
      where.milestoneId = milestoneId
    }

    if (issueId) {
      where.issueId = issueId
    }

    const [tasks, total] = await Promise.all([
      prisma.tasks.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          task_assignees: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tasks.count({ where }),
    ])

    // 转换数据格式以匹配前端期望的格式
    const formattedTasks = tasks.map((task) => ({
      ...task,
      assignees: task.task_assignees.map((ta) => ({ user: ta.users })),
    }))

    return ApiResponder.paginated(
      formattedTasks,
      {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    )
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return ApiResponder.serverError('获取任务列表失败')
  }
}

// POST /api/v1/tasks - 创建任务
export async function POST(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // 权限检查：验证用户是否有权限在该项目创建任务
    if (user.role !== 'ADMIN') {
      const projectIds = await getUserProjectIds(user.id)
      if (!projectIds.includes(validatedData.projectId)) {
        return ApiResponder.forbidden('无权在此项目创建任务')
      }
    }

    const task = await prisma.tasks.create({
      data: {
        id: crypto.randomUUID(),
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status || 'TODO',
        progress: validatedData.progress || 0,
        priority: validatedData.priority || 'MEDIUM',
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedHours: validatedData.estimatedHours,
        projects: { connect: { id: validatedData.projectId } },
        task_assignees: validatedData.assigneeIds
          ? {
              create: validatedData.assigneeIds.map((userId) => ({
                userId,
              })),
            }
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        task_assignees: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        projects: {
          select: {
            name: true,
          },
        },
      },
    })

    if (validatedData.assigneeIds && validatedData.assigneeIds.length > 0) {
      const project = await prisma.projects.findUnique({
        where: { id: validatedData.projectId },
        select: { name: true },
      })

      for (const assigneeId of validatedData.assigneeIds) {
        if (assigneeId !== user.id) {
          await notifyTaskAssigned(
            assigneeId,
            task.title,
            validatedData.projectId,
            project?.name || '未知项目',
            user.name
          )
        }
      }
    }

    return ApiResponder.created(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('数据验证失败', { issues: error.issues })
    }
    console.error('创建任务失败:', error)
    return ApiResponder.serverError('创建任务失败')
  }
}
