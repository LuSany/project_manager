import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'
import { calculateRiskLevel } from '@/types/risk'

// 更新风险验证 Schema
const updateRiskSchema = z.object({
  title: z.string().min(1, '风险标题不能为空').optional(),
  description: z.string().optional(),
  category: z.enum(['TECHNICAL', 'RESOURCE', 'SCHEDULE', 'BUDGET', 'EXTERNAL', 'MANAGEMENT']).optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  status: z.enum(['IDENTIFIED', 'ANALYZING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  mitigation: z.string().optional(),
  contingency: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  ownerId: z.string().optional(),
})

// GET /api/v1/risks/[id] - 获取风险详情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params

    const risk = await prisma.risk.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        riskTasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              },
            },
          },
        },
      },
    })

    if (!risk) {
      return ApiResponder.notFound('风险不存在')
    }

    // 验证权限
    const isOwner = risk.project.ownerId === user.id
    const isMember = risk.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此风险')
    }

    return ApiResponder.success(risk)
  } catch (error) {
    console.error('获取风险详情失败:', error)
    return ApiResponder.serverError('获取风险详情失败')
  }
}

// PUT /api/v1/risks/[id] - 更新风险
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateRiskSchema.parse(body)

    // 验证风险存在
    const existing = await prisma.risk.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!existing) {
      return ApiResponder.notFound('风险不存在')
    }

    // 验证权限：项目所有者、管理员或风险负责人可更新
    const isOwner = existing.project.ownerId === user.id
    const isRiskOwner = existing.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'
    const isProjectAdmin = existing.project.members.some(
      (m) => m.userId === user.id && m.role === 'PROJECT_ADMIN'
    )

    if (!isOwner && !isRiskOwner && !isAdmin && !isProjectAdmin) {
      return ApiResponder.forbidden('无权更新此风险')
    }

    // 如果更新了概率或影响，重新计算风险等级
    let riskLevel = existing.riskLevel
    const probability = validatedData.probability ?? existing.probability
    const impact = validatedData.impact ?? existing.impact
    if (validatedData.probability !== undefined || validatedData.impact !== undefined) {
      riskLevel = calculateRiskLevel(probability, impact)
    }

    // 如果状态变更为 RESOLVED 或 CLOSED，设置解决日期
    let resolvedDate = existing.resolvedDate
    if (
      (validatedData.status === 'RESOLVED' || validatedData.status === 'CLOSED') &&
      !existing.resolvedDate
    ) {
      resolvedDate = new Date()
    } else if (
      validatedData.status &&
      validatedData.status !== 'RESOLVED' &&
      validatedData.status !== 'CLOSED'
    ) {
      resolvedDate = null
    }

    // 更新风险
    const risk = await prisma.risk.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.probability !== undefined && { probability: validatedData.probability }),
        ...(validatedData.impact !== undefined && { impact: validatedData.impact }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.progress !== undefined && { progress: validatedData.progress }),
        ...(validatedData.mitigation !== undefined && { mitigation: validatedData.mitigation }),
        ...(validatedData.contingency !== undefined && { contingency: validatedData.contingency }),
        ...(validatedData.dueDate !== undefined && {
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        }),
        ...(validatedData.ownerId !== undefined && { ownerId: validatedData.ownerId }),
        ...(riskLevel !== existing.riskLevel && { riskLevel }),
        ...(resolvedDate !== existing.resolvedDate && { resolvedDate }),
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

    return ApiResponder.success(risk, '风险更新成功')
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
    console.error('更新风险失败:', error)
    return ApiResponder.serverError('更新风险失败')
  }
}

// DELETE /api/v1/risks/[id] - 删除风险
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params

    // 验证风险存在
    const existing = await prisma.risk.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!existing) {
      return ApiResponder.notFound('风险不存在')
    }

    // 验证权限：项目所有者、管理员可删除
    const isOwner = existing.project.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'
    const isProjectAdmin = existing.project.members.some(
      (m) => m.userId === user.id && m.role === 'PROJECT_ADMIN'
    )

    if (!isOwner && !isAdmin && !isProjectAdmin) {
      return ApiResponder.forbidden('只有项目所有者、项目管理员或系统管理员可以删除风险')
    }

    // 删除风险（级联删除关联的任务）
    await prisma.risk.delete({
      where: { id },
    })

    return ApiResponder.success({ id }, '风险删除成功')
  } catch (error) {
    console.error('删除风险失败:', error)
    return ApiResponder.serverError('删除风险失败')
  }
}
