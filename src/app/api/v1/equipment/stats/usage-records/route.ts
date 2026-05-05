import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api/response'
import { queryUsageRecords } from '@/lib/equipment-stats'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return success({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined
    const deviceId = searchParams.get('deviceId') || undefined
    const userId = searchParams.get('userId') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const sortBy = searchParams.get('sortBy') || 'startTime'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    const result = await queryUsageRecords({
      projectId,
      deviceId,
      userId,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    })
    return success(result)
  } catch (err) {
    console.error('获取使用记录失败:', err)
    return success({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
  }
}
