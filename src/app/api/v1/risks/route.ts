import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'
import { calculateRiskLevel } from '@/types/risk'

// 创建风险验证 Schema
const createRiskSchema = z.object({
  title: z.string().min(1, '风险标题不能为空'),
  description: z.string().optional(),
  category: z.enum(['TECHNICAL', 'RESOURCE', 'SCHEDULE', 'BUDGET', 'EXTERNAL', 'MANAGEMENT']).optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  status: z.enum(['IDENTIFIED', 'ANALYZING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED']).optional(),
  mitigation: z.string().optional(),
  contingency: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().min(1, '项目ID不能为空'),
})

// 查询参数验证 Schema (保留用于文档说明)
const _querySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(['IDENTIFIED', 'ANALYZING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED']).optional(),
  category: z.enum(['TECHNICAL', 'RESOURCE', 'SCHEDULE', 'BUDGET', 'EXTERNAL', 'MANAGEMENT']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
})

// GET /api/v1/risks - 获取风险列表
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const riskLevel = searchParams.get('riskLevel')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // 构建查询条件
    const where: any = {}

    // 如果指定了项目ID，则只查询该项目的风险
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
      // 如果没有指定项目ID，则查询用户有权限访问的所有项目的风险
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
        },
        select: { id: true },
      })

      const projectIds = userProjects.map((p) => p.id)
      if (projectIds.length === 0) {
        return ApiResponder.success({
          data: [],
          meta: { page, pageSize, total: 0, totalPages: 0 },
        })
      }

      where.projectId = { in: projectIds }
    }

    // 添加状态筛选
    if (status) {
      where.status = status
    }

    // 添加类别筛选
    if (category) {
      where.category = category
    }

    // 添加风险等级筛选
    if (riskLevel) {
      where.riskLevel = riskLevel
    }

    // 添加搜索条件
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // 并行查询数据和总数
    const [risks, total] = await Promise.all([
      prisma.risk.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { riskTasks: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.risk.count({ where }),
    ])

    return ApiResponder.success({
      data: risks,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取风险列表失败:', error)
    return ApiResponder.serverError('获取风险列表失败')
  }
}

// POST /api/v1/risks - 创建风险
export async function POST(req: NextRequest) {
  try {
    // 认证检查
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const body = await req.json()
    const validatedData = createRiskSchema.parse(body)

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

    // 验证权限：项目所有者、管理员或成员可创建风险
    const isOwner = project.ownerId === user.id
    const isMember = project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权在此项目创建风险')
    }

    // 计算风险等级
    const probability = validatedData.probability ?? 1
    const impact = validatedData.impact ?? 1
    const riskLevel = calculateRiskLevel(probability, impact)

    // 创建风险
    const risk = await prisma.risk.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category ?? 'TECHNICAL',
        probability,
        impact,
        riskLevel,
        status: validatedData.status ?? 'IDENTIFIED',
        mitigation: validatedData.mitigation,
        contingency: validatedData.contingency,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        projectId: validatedData.projectId,
        ownerId: user.id,
        progress: 0,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return ApiResponder.created(risk, '风险创建成功')
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
    console.error('创建风险失败:', error)
    return ApiResponder.serverError('创建风险失败')
  }
}
