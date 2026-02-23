import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

export async function GET() {
  try {
    const types = await prisma.reviewTypeConfig.findMany({
      where: { isActive: true },
      orderBy: [{ isSystem: 'desc' }, { displayName: 'asc' }],
    })

    return ApiResponder.success(types)
  } catch (error) {
    console.error('获取评审类型失败:', error)
    return ApiResponder.serverError('获取评审类型失败')
  }
}
