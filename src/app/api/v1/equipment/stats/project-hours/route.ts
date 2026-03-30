import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success } from '@/lib/api/response'
import { aggregateProjectHours } from '@/lib/equipment-stats'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return success([])
  }

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || undefined
    const topN = parseInt(searchParams.get('topN') || '10')

    const result = await aggregateProjectHours({ month, topN })
    return success(result)
  } catch (err) {
    console.error('获取项目机时统计失败:', err)
    return success([])
  }
}
