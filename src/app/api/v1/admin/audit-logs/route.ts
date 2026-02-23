import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问审计日志')
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (entityId) {
      where.entityId = entityId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    return ApiResponder.success({
      data: logs,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('获取审计日志失败:', error)
    return ApiResponder.serverError('获取审计日志失败')
  }
}
