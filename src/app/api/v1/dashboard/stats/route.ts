import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { getAuthUser } from '@/lib/auth/get-auth-user'

// GET /api/v1/dashboard/stats - 获取项目统计概览
export async function GET(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const { userId } = await getAuthUser(request)

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401)
    }

    // 检查用户是否存在
    const user = await prisma.users.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    // 构建查询条件：管理员可以看到所有项目，普通用户只能看到自己有权限的项目
    const where: any = {}
    if (user.role !== 'ADMIN') {
      where.OR = [{ ownerId: userId }, { project_members: { some: { users: { id: userId } } } }]
    }

    // 并行获取项目统计、任务统计、风险统计、任务分布
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      myTasksCount,
      completedTasksCount,
      highRisksCount,
      taskStatusDistribution,
      priorityDistribution,
    ] = await Promise.all([
      prisma.projects.count({ where }),
      prisma.projects.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.projects.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.tasks.count({
        where: {
          OR: [{ task_assignees: { some: { users: { id: userId } } } }, { acceptorId: userId }],
          status: { not: 'DONE' },
        },
      }),
      prisma.tasks.count({
        where: {
          status: 'DONE',
        },
      }),
      prisma.risks.count({
        where: {
          riskLevel: 'HIGH',
          status: { not: 'RESOLVED' },
        },
      }),
      prisma.tasks.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.tasks.groupBy({
        by: ['priority'],
        _count: true,
      }),
    ])

    return success({
      totalProjects,
      activeProjects,
      completedProjects,
      myTasksCount,
      completedTasksCount,
      highRisksCount,
      taskStatusDistribution: taskStatusDistribution.map((item) => ({
        name: item.status,
        value: item._count,
      })),
      priorityDistribution: priorityDistribution.map((item) => ({
        name: item.priority,
        value: item._count,
      })),
    })
  } catch (err) {
    console.error('获取项目统计失败:', err)
    return error('获取项目统计失败_ERROR', '获取项目统计失败', undefined, 500)
  }
}
