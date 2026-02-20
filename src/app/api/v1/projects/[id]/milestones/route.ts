import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// GET /api/v1/projects/[id]/milestones - 获取项目里程碑列表
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id } = await params

    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    // 验证权限：项目成员可查看里程碑
    const isOwner = project.ownerId === user.id
    const isMember = project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此项目的里程碑')
    }

    // 获取里程碑列表
    const milestones = await prisma.milestone.findMany({
      where: { projectId: id },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    // 计算每个里程碑的完成任务数
    const milestonesWithStats = milestones.map((m) => ({
      ...m,
      completedTasks: m.tasks.filter((t) => t.status === 'DONE').length,
      totalTasks: m.tasks.length,
    }))

    return ApiResponder.success(milestonesWithStats)
  } catch (error) {
    console.error('获取项目里程碑列表失败:', error)
    return ApiResponder.serverError('获取项目里程碑列表失败')
  }
}
