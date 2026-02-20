import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// 更新里程碑验证 Schema
const updateMilestoneSchema = z.object({
  title: z.string().min(1, '里程碑标题不能为空').optional(),
  description: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional(),
})

// GET /api/v1/milestones/[id] - 获取里程碑详情
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

    const milestone = await prisma.milestone.findUnique({
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
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
          },
        },
      },
    })

    if (!milestone) {
      return ApiResponder.notFound('里程碑不存在')
    }

    // 验证权限
    const isOwner = milestone.project.ownerId === user.id
    const isMember = milestone.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此里程碑')
    }

    return ApiResponder.success(milestone)
  } catch (error) {
    console.error('获取里程碑详情失败:', error)
    return ApiResponder.serverError('获取里程碑详情失败')
  }
}

// PUT /api/v1/milestones/[id] - 更新里程碑
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
    const validatedData = updateMilestoneSchema.parse(body)

    // 验证里程碑存在
    const existing = await prisma.milestone.findUnique({
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
      return ApiResponder.notFound('里程碑不存在')
    }

    // 验证权限：项目所有者或管理员可更新
    const isOwner = existing.project.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return ApiResponder.forbidden('只有项目所有者或系统管理员可以更新里程碑')
    }

    // 更新里程碑
    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.progress !== undefined && { progress: validatedData.progress }),
        ...(validatedData.dueDate !== undefined && { dueDate: new Date(validatedData.dueDate) }),
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

    return ApiResponder.success(milestone, '里程碑更新成功')
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
    console.error('更新里程碑失败:', error)
    return ApiResponder.serverError('更新里程碑失败')
  }
}

// DELETE /api/v1/milestones/[id] - 删除里程碑
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

    // 验证里程碑存在
    const existing = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })

    if (!existing) {
      return ApiResponder.notFound('里程碑不存在')
    }

    // 验证权限：项目所有者或系统管理员可删除
    const isOwner = existing.project.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return ApiResponder.forbidden('只有项目所有者或系统管理员可以删除里程碑')
    }

    // 删除里程碑
    await prisma.milestone.delete({
      where: { id },
    })

    return ApiResponder.success({ id }, '里程碑删除成功')
  } catch (error) {
    console.error('删除里程碑失败:', error)
    return ApiResponder.serverError('删除里程碑失败')
  }
}
