import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: milestoneId } = await params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: { members: true },
        },
      },
    })

    if (!milestone) {
      return ApiResponder.notFound('里程碑不存在')
    }

    const isOwner = milestone.project.ownerId === user.id
    const isMember = milestone.project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问此里程碑')
    }

    const where: any = { milestoneId }
    if (status) {
      where.status = status
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
          _count: { select: { subTasks: true, taskTags: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      prisma.task.count({ where }),
    ])

    return ApiResponder.success({
      data: tasks,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取里程碑任务列表失败:', error)
    return ApiResponder.serverError('获取里程碑任务列表失败')
  }
}
