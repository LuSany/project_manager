import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkIssueAutoClose } from '@/lib/services/issue-service'
import { getAuthUser } from '@/lib/auth-helpers'

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

    // 验证任务是否存在
    const task = await prisma.tasks.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    // 检查权限：项目所有者、管理员或项目成员可以更新状态
    const isProjectOwner = task.projects.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    // 查询项目成员关系
    const projectMember = await prisma.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: user.id,
        },
      },
    })

    if (!isProjectOwner && !projectMember && !isAdmin) {
      return NextResponse.json({ success: false, error: '无权更新此任务状态' }, { status: 403 })
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

    const updatedTask = await prisma.tasks.update({
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
