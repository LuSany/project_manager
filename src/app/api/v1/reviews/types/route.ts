import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'

// GET /api/v1/reviews/types - 获取评审类型列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive === 'true') {
      where.isActive = true
    }

    const types = await prisma.reviewTypeConfig.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return ApiResponder.success(types)
  } catch (error) {
    console.error('获取评审类型失败:', error)
    return ApiResponder.serverError('获取评审类型失败')
  }
}
