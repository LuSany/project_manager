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
