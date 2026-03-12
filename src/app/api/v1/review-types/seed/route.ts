import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'
import { DEFAULT_REVIEW_TYPES } from '@/lib/constants/review-types'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponder.forbidden('只有管理员可以初始化评审类型')
    }

    const results = []

    for (const type of DEFAULT_REVIEW_TYPES) {
      const existing = await prisma.reviewTypeConfig.findUnique({
        where: { name: type.name },
      })

      if (!existing) {
        const created = await prisma.reviewTypeConfig.create({
          data: type,
        })
        results.push({ name: type.name, status: 'created', id: created.id })
      } else {
        results.push({ name: type.name, status: 'exists', id: existing.id })
      }
    }

    return ApiResponder.success(results, '评审类型初始化完成')
  } catch (error) {
    console.error('初始化评审类型失败:', error)
    return ApiResponder.serverError('初始化评审类型失败')
  }
}
