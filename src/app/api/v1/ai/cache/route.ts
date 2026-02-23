import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'
import crypto from 'crypto'

function generateCacheKey(prompt: string, context: Record<string, unknown>): string {
  const content = JSON.stringify({ prompt, context })
  return `ai:${crypto.createHash('sha256').update(content).digest('hex')}`
}

function generateRequestHash(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex')
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以访问缓存信息')
    }

    const { searchParams } = new URL(req.url)
    const serviceType = searchParams.get('serviceType')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {}

    if (serviceType) {
      where.serviceType = serviceType
    }

    const [cacheEntries, total, stats] = await Promise.all([
      prisma.aiResponseCache.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.aiResponseCache.count({ where }),
      prisma.aiResponseCache.aggregate({
        _avg: { hitCount: true },
        _count: true,
      }),
    ])

    return ApiResponder.success({
      data: cacheEntries,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        totalEntries: stats._count,
        averageHits: stats._avg.hitCount || 0,
      },
    })
  } catch (error) {
    console.error('获取AI缓存信息失败:', error)
    return ApiResponder.serverError('获取AI缓存信息失败')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以清除缓存')
    }

    const { searchParams } = new URL(req.url)
    const cacheKey = searchParams.get('cacheKey')
    const serviceType = searchParams.get('serviceType')
    const all = searchParams.get('all') === 'true'

    let deletedCount = 0

    if (all) {
      const result = await prisma.aiResponseCache.deleteMany({})
      deletedCount = result.count
    } else if (cacheKey) {
      await prisma.aiResponseCache.delete({
        where: { cacheKey },
      })
      deletedCount = 1
    } else if (serviceType) {
      const result = await prisma.aiResponseCache.deleteMany({
        where: { serviceType: serviceType as any },
      })
      deletedCount = result.count
    } else {
      const result = await prisma.aiResponseCache.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })
      deletedCount = result.count
    }

    return ApiResponder.success({ deleted: deletedCount }, '缓存清除成功')
  } catch (error) {
    console.error('清除AI缓存失败:', error)
    return ApiResponder.serverError('清除AI缓存失败')
  }
}
