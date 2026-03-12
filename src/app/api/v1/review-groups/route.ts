import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// 创建评审组验证Schema
const createReviewGroupSchema = z.object({
  name: z.string().min(1, '评审组名称不能为空'),
  description: z.string().optional(),
  members: z.array(z.object({
    userId: z.string(),
    role: z.enum(['MODERATOR', 'REVIEWER', 'OBSERVER', 'SECRETARY']).default('REVIEWER'),
  })).optional(),
})

// GET /api/v1/review-groups - 获取评审组列表
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive === 'true') {
      where.isActive = true
    }

    const groups = await prisma.reviewGroup.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponder.success(groups)
  } catch (error) {
    console.error('获取评审组列表失败:', error)
    return ApiResponder.serverError('获取评审组列表失败')
  }
}

// POST /api/v1/review-groups - 创建评审组
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const body = await req.json()
    const validatedData = createReviewGroupSchema.parse(body)

    // 创建评审组
    const group = await prisma.reviewGroup.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        createdById: user.id,
        members: validatedData.members
          ? {
              create: validatedData.members.map((member) => ({
                userId: member.userId,
                role: member.role,
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return ApiResponder.created(group, '评审组创建成功')
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
    console.error('创建评审组失败:', error)
    return ApiResponder.serverError('创建评审组失败')
  }
}