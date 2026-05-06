import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api/response'
import { aggregateProjectHours } from '@/lib/equipment-stats'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return success([])
  }

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || undefined
    const topN = parseInt(searchParams.get('topN') || '10')
    const deviceTypeId = searchParams.get('deviceTypeId') || undefined

    const result = await aggregateProjectHours({ month, topN, deviceTypeId } as any)
    return success(result)
  } catch (err) {
    console.error('获取项目机时统计失败:', err)
    return success([])
  }
}
