import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { notifyTaskAssigned } from '@/lib/notification'

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

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
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const milestoneId = searchParams.get('milestoneId')
    const issueId = searchParams.get('issueId')

    const skip = (page - 1) * pageSize

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
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
      db.tasks.findMany({
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
      db.tasks.count({ where }),
    ])

    // 转换数据格式以匹配前端期望的格式
    const formattedTasks = tasks.map((task) => ({
      ...task,
      assignees: task.task_assignees.map((ta) => ({ user: ta.users })),
    }))

    return NextResponse.json({
      success: true,
      data: {
        items: formattedTasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return NextResponse.json({ success: false, error: '获取任务列表失败' }, { status: 500 })
  }
}

// POST /api/v1/tasks - 创建任务
export async function POST(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    const task = await db.tasks.create({
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
      const project = await db.projects.findUnique({
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

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('创建任务失败:', error)
    return NextResponse.json({ success: false, error: '创建任务失败' }, { status: 500 })
  }
}
