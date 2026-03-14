import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'
import { notifyReviewComment, notifyCommentReply } from '@/lib/notification'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  materialId: z.string().optional(),
  itemId: z.string().optional(),
  parentId: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('Please login first')
    }

    const { id: reviewId } = await params

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: { include: { members: true } } },
    })

    if (!review) {
      return ApiResponder.notFound('Review not found')
    }

    const isOwner = review.project.ownerId === user.id
    const isMember = review.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('No access to this review')
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'OPEN' | 'RESOLVED' | null
    const materialId = searchParams.get('materialId')
    const itemId = searchParams.get('itemId')

    const where: any = { reviewId }
    if (status) where.status = status
    if (materialId) where.materialId = materialId
    if (itemId) where.itemId = itemId

    const comments = await prisma.reviewComment.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        material: { select: { id: true, fileName: true } },
        item: { select: { id: true, title: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponder.success(comments)
  } catch (error) {
    console.error('Get comments failed:', error)
    return ApiResponder.serverError('Get comments failed')
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('Please login first')
    }

    const { id: reviewId } = await params
    const body = await req.json()
    const validatedData = createCommentSchema.parse(body)

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: { include: { members: true } } },
    })

    if (!review) {
      return ApiResponder.notFound('Review not found')
    }

    const isOwner = review.project.ownerId === user.id
    const isMember = review.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('No permission to comment')
    }

    if (validatedData.parentId) {
      const parentComment = await prisma.reviewComment.findUnique({
        where: { id: validatedData.parentId },
      })
      if (!parentComment || parentComment.reviewId !== reviewId) {
        return ApiResponder.notFound('Parent comment not found')
      }
      if (parentComment.parentId) {
        return ApiResponder.error('INVALID_REQUEST', 'Multi-level replies not supported', undefined, 400)
      }
    }

    if (validatedData.materialId) {
      const material = await prisma.reviewMaterial.findUnique({
        where: { id: validatedData.materialId },
      })
      if (!material || material.reviewId !== reviewId) {
        return ApiResponder.notFound('Material not found')
      }
    }

    if (validatedData.itemId) {
      const item = await prisma.reviewItem.findUnique({
        where: { id: validatedData.itemId },
      })
      if (!item || item.reviewId !== reviewId) {
        return ApiResponder.notFound('Review item not found')
      }
    }

    const comment = await prisma.reviewComment.create({
      data: {
        reviewId,
        authorId: user.id,
        content: validatedData.content,
        materialId: validatedData.materialId,
        itemId: validatedData.itemId,
        parentId: validatedData.parentId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        material: { select: { id: true, fileName: true } },
        item: { select: { id: true, title: true } },
      },
    })

    // 发送通知
    try {
      if (validatedData.parentId) {
        // 回复通知：通知父评论作者
        const parentComment = await prisma.reviewComment.findUnique({
          where: { id: validatedData.parentId },
          select: { authorId: true },
        })
        if (parentComment && parentComment.authorId !== user.id) {
          await notifyCommentReply(
            parentComment.authorId,
            review.title,
            review.projectId,
            user.name
          )
        }
      } else {
        // 新评论通知：通知评审作者
        if (review.authorId && review.authorId !== user.id) {
          await notifyReviewComment(
            review.authorId,
            review.title,
            review.projectId,
            user.name
          )
        }
      }
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError)
    }

    return ApiResponder.success(comment, 'Comment created')
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message
          return acc
        },
        {} as Record<string, string>
      )
      return ApiResponder.validationError('Validation failed', issues)
    }
    console.error('Create comment failed:', error)
    return ApiResponder.serverError('Create comment failed')
  }
}