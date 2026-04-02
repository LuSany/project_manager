import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'

// GET /api/v1/dashboard/progress - 获取进度追踪数据
export async function GET(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401)
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      const where: any =
        user.role === 'ADMIN'
          ? {}
          : {
              OR: [{ ownerId: userId }, { project_members: { some: { users: { id: userId } } } }],
            }

      const userProjects = await prisma.projects.findMany({
        where,
        select: { id: true },
      })

      const projectIds = userProjects.map((p) => p.id)

      if (projectIds.length === 0) {
        return NextResponse.json(success({ milestones: [] }))
      }

      const globalMilestones = await prisma.milestones.findMany({
        where: {
          projectId: { in: projectIds },
          status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        include: {
          projects: {
            select: { name: true },
          },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        take: 6,
      })

      return NextResponse.json(
        success({
          milestones: globalMilestones.map((m) => ({
            milestoneId: m.id,
            title: m.title,
            status: m.status,
            progress: m.progress,
            dueDate: m.dueDate,
            projectId: m.projectId,
            projectName: m.projects.name,
          })),
        })
      )
    }

    // 验证用户是否为项目成员
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        project_members: {
          where: { users: { id: userId } },
        },
      },
    })

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404)
    }

    if (project.ownerId !== userId && project.project_members.length === 0) {
      return error('FORBIDDEN_ERROR', '无权访问此项目', undefined, 403)
    }

    // 获取里程碑进度
    const milestones = await prisma.milestones.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    })

    // 获取任务完成率
    const totalTasks = await prisma.tasks.count({ where: { projectId } })
    const completedTasks = await prisma.tasks.count({ where: { projectId, status: 'DONE' } })

    const milestoneProgress = milestones.map((m) => ({
      id: m.id,
      title: m.title,
      progress: m.progress,
      dueDate: m.dueDate,
    }))

    return NextResponse.json(
      success({
        milestones: milestoneProgress,
        totalTasks,
        completedTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      })
    )
  } catch (err) {
    console.error('获取进度追踪数据失败:', err)
    return error('FETCH_PROGRESS_FAILED', '获取进度追踪数据失败', undefined, 500)
  }
}
