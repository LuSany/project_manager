import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import type { SearchType, SearchResult } from '@/types/search'
import { SearchType as SearchTypeEnum } from '@/types/search'
import { getAuthUser } from '@/lib/auth/get-auth-user'

export async function GET(request: NextRequest) {
  const { userId } = await getAuthUser(request)

  if (!userId) {
    return error('UNAUTHORIZED', '未授权，请先登录', undefined, 401)
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const typesParam = searchParams.get('types')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  if (!query.trim()) {
    return success({
      results: {},
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    })
  }

  const types: SearchType[] = typesParam
    ? (typesParam.split(',').map((t) => t.toUpperCase().trim()) as SearchType[])
    : [
        'PROJECT' as SearchType,
        'TASK' as SearchType,
        'REQUIREMENT' as SearchType,
        'ISSUE' as SearchType,
        'RISK' as SearchType,
      ]

  const isAdmin = user.role === 'ADMIN'
  const searchQuery = query.trim()

  const results: Partial<Record<SearchType, any[]>> = {}
  let total = 0

  const skip = (page - 1) * pageSize
  const take = pageSize

  const projectWhere: any = {
    OR: [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ],
  }

  if (!isAdmin) {
    projectWhere.OR = [{ ownerId: userId }, { project_members: { some: { userId } } }]
    projectWhere.OR.push(
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } }
    )
  }

  if (types.includes('PROJECT' as SearchType)) {
    const projects = await prisma.projects.findMany({
      where: projectWhere,
      skip,
      take,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
      },
    })

    results.PROJECT = projects.map((p) => ({
      id: p.id,
      type: SearchTypeEnum.PROJECT,
      title: p.name,
      description: p.description,
      status: p.status,
      url: `/projects/${p.id}`,
      createdAt: p.createdAt.toISOString(),
    }))

    total += results.PROJECT.length
  }

  if (types.includes('TASK' as SearchType)) {
    const taskWhere: any = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }

    if (!isAdmin) {
      taskWhere.projects = {
        OR: [{ ownerId: userId }, { project_members: { some: { userId } } }],
      }
    }

    const tasks = await prisma.tasks.findMany({
      where: taskWhere,
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        projectId: true,
        createdAt: true,
      },
    })

    results.TASK = tasks.map((t) => ({
      id: t.id,
      type: SearchTypeEnum.TASK,
      title: t.title,
      description: t.description,
      status: t.status,
      url: `/projects/${t.projectId}/tasks/${t.id}`,
      createdAt: t.createdAt.toISOString(),
    }))

    total += results.TASK.length
  }

  if (types.includes('REQUIREMENT' as SearchType)) {
    const requirementWhere: any = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }

    if (!isAdmin) {
      requirementWhere.projects = {
        OR: [{ ownerId: userId }, { project_members: { some: { userId } } }],
      }
    }

    const requirements = await prisma.requirements.findMany({
      where: requirementWhere,
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        projectId: true,
        createdAt: true,
      },
    })

    results.REQUIREMENT = requirements.map((r) => ({
      id: r.id,
      type: SearchTypeEnum.REQUIREMENT,
      title: r.title,
      description: r.description,
      status: r.status,
      url: `/projects/${r.projectId}/requirements/${r.id}`,
      createdAt: r.createdAt.toISOString(),
    }))

    total += results.REQUIREMENT.length
  }

  if (types.includes('ISSUE' as SearchType)) {
    const issueWhere: any = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }

    if (!isAdmin) {
      issueWhere.projects = {
        OR: [{ ownerId: userId }, { project_members: { some: { userId } } }],
      }
    }

    const issues = await prisma.issues.findMany({
      where: issueWhere,
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        projectId: true,
        createdAt: true,
      },
    })

    results.ISSUE = issues.map((i) => ({
      id: i.id,
      type: SearchTypeEnum.ISSUE,
      title: i.title,
      description: i.description,
      status: i.status,
      url: `/projects/${i.projectId}/issues/${i.id}`,
      createdAt: i.createdAt.toISOString(),
    }))

    total += results.ISSUE.length
  }

  if (types.includes('RISK' as SearchType)) {
    const riskWhere: any = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }

    if (!isAdmin) {
      riskWhere.projects = {
        OR: [{ ownerId: userId }, { project_members: { some: { userId } } }],
      }
    }

    const risks = await prisma.risks.findMany({
      where: riskWhere,
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        projectId: true,
        createdAt: true,
      },
    })

    results.RISK = risks.map((r) => ({
      id: r.id,
      type: SearchTypeEnum.RISK,
      title: r.title,
      description: r.description,
      status: r.status,
      url: `/projects/${r.projectId}/risks/${r.id}`,
      createdAt: r.createdAt.toISOString(),
    }))

    total += results.RISK.length
  }

  const totalPages = Math.ceil(total / pageSize)

  return success<SearchResult>({
    results,
    total,
    page,
    pageSize,
    totalPages,
  })
}
