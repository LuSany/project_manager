import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const createReviewSchema = z.object({
  title: z.string().min(1, '评审标题不能为空'),
  description: z.string().optional(),
  projectId: z.string().min(1, '项目ID不能为空'),
  typeId: z.string().min(1, '评审类型ID不能为空'),
  scheduledAt: z.string().datetime().optional(),
  // 新增：参与者和材料
  participants: z
    .array(
      z.object({
        userId: z.string(),
        role: z.enum(['MODERATOR', 'REVIEWER', 'OBSERVER', 'SECRETARY']),
      })
    )
    .optional(),
  materials: z
    .array(
      z.object({
        fileId: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
      })
    )
    .optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const typeId = searchParams.get('typeId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {}

    if (projectId) {
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        include: { project_members: true },
      })

      if (!project) {
        return ApiResponder.notFound('项目不存在')
      }

      const isOwner = project.ownerId === user.id
      const isMember = project.project_members.some((m) => m.userId === user.id)
      const isAdmin = user.role === 'ADMIN'

      if (!isOwner && !isMember && !isAdmin) {
        return ApiResponder.forbidden('无权访问此项目')
      }

      where.projectId = projectId
    } else {
      const userProjects = await prisma.projects.findMany({
        where: {
          OR: [{ ownerId: user.id }, { project_members: { some: { userId: user.id } } }],
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

    if (status) {
      where.status = status
    }

    if (typeId) {
      where.typeId = typeId
    }

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        include: {
          projects: { select: { id: true, name: true } },
          ReviewTypeConfig: { select: { id: true, displayName: true } },
          _count: { select: { review_materials: true, review_participants: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.reviews.count({ where }),
    ])

    const formattedReviews = reviews.map((review) => ({
      ...review,
      type: review.ReviewTypeConfig,
    }))

    return ApiResponder.success({
      data: formattedReviews,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取评审列表失败:', error)
    return ApiResponder.serverError('获取评审列表失败')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const body = await req.json()
    const validatedData = createReviewSchema.parse(body)

    const project = await prisma.projects.findUnique({
      where: { id: validatedData.projectId },
      include: { project_members: true },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    const isOwner = project.ownerId === user.id
    const isMember = project.project_members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权在此项目创建评审')
    }

    const typeExists = await prisma.reviewTypeConfig.findUnique({
      where: { id: validatedData.typeId },
    })

    if (!typeExists) {
      return ApiResponder.notFound('评审类型不存在')
    }

    const review = await prisma.reviews.create({
      data: {
        id: crypto.randomUUID(),
        title: validatedData.title,
        description: validatedData.description,
        projects: { connect: { id: validatedData.projectId } },
        ReviewTypeConfig: { connect: { id: validatedData.typeId } },
        users: { connect: { id: user.id } },
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
        status: 'PENDING',
        updatedAt: new Date(),
        // 新增：创建参与者和材料
        review_participants: validatedData.participants
          ? {
              create: validatedData.participants.map((p) => ({
                userId: p.userId,
                role: p.role,
              })),
            }
          : undefined,
        review_materials: validatedData.materials
          ? {
              create: validatedData.materials.map((m) => ({
                id: crypto.randomUUID(),
                fileId: m.fileId,
                fileName: m.fileName,
                fileType: m.fileType,
                fileSize: m.fileSize,
                uploaderId: user.id,
              })),
            }
          : undefined,
      },
      include: {
        projects: { select: { id: true, name: true } },
        ReviewTypeConfig: { select: { id: true, displayName: true } },
        review_participants: {
          include: {
            users: { select: { id: true, name: true, email: true } },
          },
        },
        review_materials: true,
      },
    })

    return ApiResponder.success(review, '评审创建成功')
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
    console.error('创建评审失败:', error)
    return ApiResponder.serverError('创建评审失败')
  }
}
