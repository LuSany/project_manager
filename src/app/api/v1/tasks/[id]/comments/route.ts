import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

// GET: 获取任务的评论列表
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params

  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    // 检查任务是否存在
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    // 从数据库获取评论
    const comments = await db.task_comments.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    // 格式化响应数据
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      user: comment.users,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: formattedComments,
    })
  } catch (error) {
    console.error('获取评论列表失败:', error)
    return NextResponse.json({ success: false, error: '获取评论列表失败' }, { status: 500 })
  }
}

// POST: 创建新评论
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params

  // 认证检查
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: '评论内容不能为空' }, { status: 400 })
    }

    // 检查任务是否存在
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    // 保存评论到数据库
    const commentId = randomUUID()
    const newComment = await db.task_comments.create({
      data: {
        id: commentId,
        taskId,
        userId: user.id,
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    // 格式化响应数据
    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      userId: newComment.userId,
      user: newComment.users,
      createdAt: newComment.createdAt.toISOString(),
      updatedAt: newComment.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: formattedComment,
    })
  } catch (error) {
    console.error('创建评论失败:', error)
    return NextResponse.json({ success: false, error: '创建评论失败' }, { status: 500 })
  }
}
