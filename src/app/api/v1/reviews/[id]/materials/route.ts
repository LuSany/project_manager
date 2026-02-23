import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

const createMaterialSchema = z.object({
  fileId: z.string().min(1, '文件ID不能为空'),
  fileName: z.string().min(1, '文件名不能为空'),
  fileType: z.string().min(1, '文件类型不能为空'),
  fileSize: z.number().min(1, '文件大小不能为空'),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: reviewId } = await params

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: { include: { members: true } } },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.project.ownerId === user.id
    const isMember = review.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此评审')
    }

    const materials = await prisma.reviewMaterial.findMany({
      where: { reviewId },
      orderBy: { uploadedAt: 'desc' },
    })

    return ApiResponder.success(materials)
  } catch (error) {
    console.error('获取评审材料列表失败:', error)
    return ApiResponder.serverError('获取评审材料列表失败')
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: reviewId } = await params
    const body = await req.json()
    const validatedData = createMaterialSchema.parse(body)

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: { include: { members: true } } },
    })

    if (!review) {
      return ApiResponder.notFound('评审不存在')
    }

    const isOwner = review.project.ownerId === user.id
    const isMember = review.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权添加评审材料')
    }

    const material = await prisma.reviewMaterial.create({
      data: {
        reviewId,
        fileId: validatedData.fileId,
        fileName: validatedData.fileName,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
      },
    })

    return ApiResponder.success(material, '评审材料添加成功')
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
    console.error('添加评审材料失败:', error)
    return ApiResponder.serverError('添加评审材料失败')
  }
}
