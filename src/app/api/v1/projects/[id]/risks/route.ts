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
  category: z.enum(['TECHNICAL', 'RESOURCE', 'SCHEDULE', 'BUDGET', 'EXTERNAL', 'MANAGEMENT', 'OTHER']).optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  status: z.enum(['IDENTIFIED', 'ANALYZING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED']).optional(),
  mitigation: z.string().optional(),
  contingency: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

// GET /api/v1/projects/[id]/risks - 获取项目风险列表
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const user = await getAuthenticatedUser(req)

    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    // 验证项目存在且用户有权限
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

    // 获取项目风险列表
    const risks = await prisma.risk.findMany({
      where: { projectId },
      include: {
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
      orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }],
    })

    return ApiResponder.success(risks)
  } catch (error) {
    console.error('获取项目风险列表失败:', error)
    return ApiResponder.serverError('获取风险列表失败')
  }
}

// POST /api/v1/projects/[id]/risks - 在项目下创建风险
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const user = await getAuthenticatedUser(req)

    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    // 验证权限
    const isOwner = project.ownerId === user.id
    const isMember = project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权在此项目创建风险')
    }

    const body = await req.json()
    const validatedData = createRiskSchema.parse(body)

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
        projectId,
        ownerId: user.id,
        progress: 0,
      },
      include: {
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
