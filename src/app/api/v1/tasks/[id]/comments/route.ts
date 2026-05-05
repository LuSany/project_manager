import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponder } from '@/lib/api/response'
import { z } from 'zod'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

const createCommentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(2000, '评论内容不能超过2000字'),
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params

  const user = await getAuthUser(request)
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      include: {
        projects: {
          select: {
            ownerId: true,
            project_members: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!task) {
      return ApiResponder.notFound('任务不存在')
    }

    const isProjectOwner = task.projects.ownerId === user.id
    const isProjectMember = task.projects.project_members.length > 0
    const isAdmin = user.role === 'ADMIN'

    if (!isProjectOwner && !isProjectMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此任务')
    }

    const comments = await db.task_comments.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      user: comment.users,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    }))

    return ApiResponder.success(formattedComments)
  } catch (error) {
    console.error('获取评论列表失败:', error)
    return ApiResponder.serverError('获取评论列表失败')
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params

  const user = await getAuthUser(request)
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    const task = await db.tasks.findUnique({
      where: { id: taskId },
      include: {
        projects: {
          select: {
            ownerId: true,
            project_members: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!task) {
      return ApiResponder.notFound('任务不存在')
    }

    const isProjectOwner = task.projects.ownerId === user.id
    const isProjectMember = task.projects.project_members.length > 0
    const isAdmin = user.role === 'ADMIN'

    if (!isProjectOwner && !isProjectMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此任务')
    }

    const newComment = await db.task_comments.create({
      data: {
        id: crypto.randomUUID(),
        taskId,
        userId: user.id,
        content: validatedData.content.trim(),
      },
      include: {
        users: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      userId: newComment.userId,
      user: newComment.users,
      createdAt: newComment.createdAt.toISOString(),
      updatedAt: newComment.updatedAt.toISOString(),
    }

    return ApiResponder.created(formattedComment, '评论创建成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError(error.issues[0].message)
    }
    console.error('创建评论失败:', error)
    return ApiResponder.serverError('创建评论失败')
  }
}
