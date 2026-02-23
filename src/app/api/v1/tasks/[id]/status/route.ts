import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE']).optional(),
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

    const updatedTask = await db.task.update({
      where: { id },
      data: validatedData,
    })

    if (validatedData.status === 'DONE' && updatedTask.issueId) {
      await db.issue.update({
        where: { id: updatedTask.issueId },
        data: { status: 'RESOLVED' },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 })
    }
    console.error('更新任务状态失败:', error)
    return NextResponse.json({ success: false, error: '更新任务状态失败' }, { status: 500 })
  }
}
