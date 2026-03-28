import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponder } from '@/lib/api/response'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: taskId, commentId } = await context.params

  const user = await getAuthUser(request)
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const comment = await db.task_comments.findUnique({
      where: { id: commentId },
      include: {
        tasks: {
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
        },
      },
    })

    if (!comment) {
      return ApiResponder.notFound('评论不存在')
    }

    if (comment.taskId !== taskId) {
      return ApiResponder.forbidden('评论不属于该任务')
    }

    const isAuthor = comment.userId === user.id
    const isProjectOwner = comment.tasks.projects.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isAuthor && !isProjectOwner && !isAdmin) {
      return ApiResponder.forbidden('无权删除此评论')
    }

    await db.task_comments.delete({
      where: { id: commentId },
    })

    return ApiResponder.success({ message: '评论删除成功' }, '评论删除成功')
  } catch (error) {
    console.error('删除评论失败:', error)
    return ApiResponder.serverError('删除评论失败')
  }
}
