import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { checkIssueAutoClose } from '@/lib/services/issue-service'

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE', 'CANCELLED', 'DELAYED', 'BLOCKED']).optional(),
  milestoneId: z.string().optional(),
  issueId: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // 验证任务是否存在且用户有权限访问
    const task = await db.task.findFirst({
      where: {
        id,
        project: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在或无权访问' }, { status: 404 })
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = { ...validatedData }

    // 当任务状态变为 DONE 时，设置 completedAt
    if (validatedData.status === 'DONE') {
      updateData.completedAt = new Date()
    }
    // 当任务状态从 DONE 变为其他状态时，清除 completedAt
    else if (task.status === 'DONE' && validatedData.status) {
      updateData.completedAt = null
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: updateData,
    })

    // 当任务状态变为 DONE 时，检查关联的 Issue 是否应该自动关闭
    if (validatedData.status === 'DONE' && updatedTask.issueId) {
      await checkIssueAutoClose(updatedTask.issueId)
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('更新任务状态失败:', error)
    return NextResponse.json({ success: false, error: '更新任务状态失败' }, { status: 500 })
  }
}
