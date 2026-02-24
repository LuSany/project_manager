import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// DELETE /api/v1/risks/[id]/tasks/[taskId] - 移除任务关联
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: riskId, taskId } = await params

    // 验证风险存在
    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
      include: {
        project: {
          include: { members: true },
        },
      },
    })

    if (!risk) {
      return ApiResponder.notFound('风险不存在')
    }

    // 验证权限：项目所有者、管理员或风险负责人可移除关联
    const isOwner = risk.project.ownerId === user.id
    const isRiskOwner = risk.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'
    const isProjectAdmin = risk.project.members.some(
      (m) => m.userId === user.id && m.role === 'PROJECT_ADMIN'
    )

    if (!isOwner && !isRiskOwner && !isAdmin && !isProjectAdmin) {
      return ApiResponder.forbidden('无权移除此任务的关联')
    }

    // 查找关联记录
    const riskTask = await prisma.riskTask.findFirst({
      where: {
        riskId,
        taskId,
      },
    })

    if (!riskTask) {
      return ApiResponder.notFound('任务关联不存在')
    }

    // 删除关联
    await prisma.riskTask.delete({
      where: {
        id: riskTask.id,
      },
    })

    return ApiResponder.success({ riskId, taskId }, '任务关联移除成功')
  } catch (error) {
    console.error('移除任务关联失败:', error)
    return ApiResponder.serverError('移除任务关联失败')
  }
}
