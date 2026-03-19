import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// 关联任务验证 Schema
const associateTaskSchema = z.object({
  taskId: z.string().min(1, '任务ID不能为空'),
  relationType: z.enum(['RELATED', 'CAUSES', 'MITIGATES']).optional(),
})

// GET /api/v1/risks/[id]/tasks - 获取关联任务列表
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: riskId } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // 验证风险存在且用户有权限访问
    const risk = await prisma.risks.findUnique({
      where: { id: riskId },
      include: {
        projects: {
          include: { project_members: true },
        },
      },
    })

    if (!risk) {
      return ApiResponder.notFound('风险不存在')
    }

    const isOwner = risk.projects.ownerId === user.id
    const isMember = risk.projects.project_members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此风险')
    }

    // 查询关联任务
    const [risk_tasks, total] = await Promise.all([
      prisma.risk_tasks.findMany({
        where: { riskId },
        include: {
          tasks: {
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
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.risk_tasks.count({ where: { riskId } }),
    ])

    return ApiResponder.success({
      data: risk_tasks,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取关联任务列表失败:', error)
    return ApiResponder.serverError('获取关联任务列表失败')
  }
}

// POST /api/v1/risks/[id]/tasks - 关联任务到风险
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: riskId } = await params
    const body = await req.json()
    const validatedData = associateTaskSchema.parse(body)

    // 验证风险存在
    const risk = await prisma.risks.findUnique({
      where: { id: riskId },
      include: {
        projects: {
          include: { project_members: true },
        },
      },
    })

    if (!risk) {
      return ApiResponder.notFound('风险不存在')
    }

    // 验证任务存在
    const task = await prisma.tasks.findUnique({
      where: { id: validatedData.taskId },
      include: {
        projects: true,
      },
    })

    if (!task) {
      return ApiResponder.notFound('任务不存在')
    }

    // 验证任务属于同一项目
    if (task.projectId !== risk.projectId) {
      return ApiResponder.validationError('任务和风险必须属于同一项目', {
        projectId: '任务和风险必须属于同一项目',
      })
    }

    // 验证权限：项目所有者、管理员或成员可关联任务
    const isOwner = risk.projects.ownerId === user.id
    const isMember = risk.projects.project_members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权关联任务到此风险')
    }

    // 检查是否已经关联
    const existing = await prisma.risk_tasks.findFirst({
      where: {
        riskId,
        taskId: validatedData.taskId,
      },
    })

    if (existing) {
      return ApiResponder.validationError('任务已关联到此风险', {
        taskId: '任务已关联到此风险',
      })
    }

    // 创建关联
    const riskTask = await prisma.risk_tasks.create({
      data: {
        id: crypto.randomUUID(),
        risks: { connect: { id: riskId } },
        tasks: { connect: { id: validatedData.taskId } },
        relationType: validatedData.relationType ?? 'RELATED',
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    })

    return ApiResponder.created(riskTask, '任务关联成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message
          return acc
        },
        {} as Record<string, string>
      )
      return ApiResponder.validationError('数据验证失败', issues)
    }
    console.error('关联任务失败:', error)
    return ApiResponder.serverError('关联任务失败')
  }
}
