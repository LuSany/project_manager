import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

// DELETE: 删除指定评论
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: taskId, commentId } = await context.params

  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    // 验证评论存在
    const comment = await db.task_comments.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: '评论不存在' }, { status: 404 })
    }

    // 验证评论属于该任务
    if (comment.taskId !== taskId) {
      return NextResponse.json({ success: false, error: '评论不属于该任务' }, { status: 403 })
    }

    // 权限检查：仅作者可删除自己的评论
    if (comment.userId !== user.id) {
      return NextResponse.json({ success: false, error: '无权删除此评论' }, { status: 403 })
    }

    // 删除评论
    await db.task_comments.delete({
      where: { id: commentId },
    })

    return NextResponse.json({
      success: true,
      data: { message: '评论删除成功' },
    })
  } catch (error) {
    console.error('删除评论失败:', error)
    return NextResponse.json({ success: false, error: '删除评论失败' }, { status: 500 })
  }
}
