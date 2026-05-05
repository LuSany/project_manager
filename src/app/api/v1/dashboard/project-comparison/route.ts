import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { getAuthUser } from '@/lib/auth/get-auth-user'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuthUser(request)

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401)
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    const where: any = {}
    if (user.role !== 'ADMIN') {
      where.OR = [{ ownerId: userId }, { project_members: { some: { users: { id: userId } } } }]
    }

    const projects = await prisma.projects.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      take: 8,
    })

    if (projects.length === 0) {
      return NextResponse.json(success([]))
    }

    const projectIds = projects.map((p) => p.id)

    const taskCounts = await prisma.tasks.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds } },
      _count: true,
    })

    const completedTaskCounts = await prisma.tasks.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds }, status: 'DONE' },
      _count: true,
    })

    const totalMap = new Map(taskCounts.map((t) => [t.projectId, t._count]))
    const completedMap = new Map(completedTaskCounts.map((t) => [t.projectId, t._count]))

    const comparisonData = projects
      .map((project) => {
        const total = totalMap.get(project.id) || 0
        const completed = completedMap.get(project.id) || 0
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
          projectId: project.id,
          projectName: project.name,
          completionRate,
        }
      })
      .sort((a, b) => b.completionRate - a.completionRate)

    return NextResponse.json(success(comparisonData))
  } catch (err) {
    console.error('获取项目对比数据失败:', err)
    return error('FETCH_PROJECT_COMPARISON_FAILED', '获取项目对比数据失败', undefined, 500)
  }
}
