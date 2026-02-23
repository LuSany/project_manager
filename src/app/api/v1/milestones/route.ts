import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// 创建里程碑验证 Schema
const createMilestoneSchema = z.object({
  title: z.string().min(1, '里程碑标题不能为空'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().min(1, '项目ID不能为空'),
})

// 查询参数验证 Schema
const querySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
})

// GET /api/v1/milestones - 获取里程碑列表
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // 构建查询条件
    const where: any = {}

    // 如果指定了项目ID，则只查询该项目的里程碑
    if (projectId) {
      // 验证项目存在且用户有权限访问
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true },
      })

      if (!project) {
        return ApiResponder.notFound('项目不存在')
      }

      const isOwner = project.ownerId === user.id
      const isMember = project.members.some((m) => m.userId === user.id)
      const isAdmin = user.role === 'ADMIN'

      if (!isOwner && !isMember && !isAdmin) {
        return ApiResponder.forbidden('无权访问此项目')
      }

      where.projectId = projectId
    } else {
      // 如果没有指定项目ID，则查询用户有权限访问的所有项目的里程碑
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
        },
        select: { id: true },
      })

      const projectIds = userProjects.map((p) => p.id)
      if (projectIds.length === 0) {
        return ApiResponder.success({ data: [], meta: { page, pageSize, total: 0, totalPages: 0 } })
      }

      where.projectId = { in: projectIds }
    }

    // 添加状态筛选
    if (status) {
      where.status = status
    }

    // 并行查询数据和总数
    const [milestones, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { tasks: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.milestone.count({ where }),
    ])

    return ApiResponder.success({
      data: milestones,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取里程碑列表失败:', error)
    return ApiResponder.serverError('获取里程碑列表失败')
  }
}

// POST /api/v1/milestones - 创建里程碑
export async function POST(req: NextRequest) {
  try {
    // 认证检查
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const body = await req.json()
    const validatedData = createMilestoneSchema.parse(body)

    // 验证项目存在且用户有权限
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        members: true,
      },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    // 验证权限：项目所有者、管理员或成员可创建里程碑
    const isOwner = project.ownerId === user.id
    const isMember = project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权在此项目创建里程碑')
    }

    // 创建里程碑
    const milestone = await prisma.milestone.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        projectId: validatedData.projectId,
        status: 'NOT_STARTED',
        progress: 0,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return ApiResponder.success(milestone, '里程碑创建成功')
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
    console.error('创建里程碑失败:', error)
    return ApiResponder.serverError('创建里程碑失败')
  }
}
