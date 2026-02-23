import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问投递记录')
    }

    const { id: webhookId } = await params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = { webhookId }

    if (status) {
      where.status = status
    }

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { attemptedAt: 'desc' },
      }),
      prisma.webhookDelivery.count({ where }),
    ])

    return ApiResponder.success({
      data: deliveries,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('获取Webhook投递记录失败:', error)
    return ApiResponder.serverError('获取Webhook投递记录失败')
  }
}
