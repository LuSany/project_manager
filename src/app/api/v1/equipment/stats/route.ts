import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success } from '@/lib/api/response'
import { getStatsOverview } from '@/lib/equipment-stats'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return success(null)
  }

  try {
    const stats = await getStatsOverview()
    return success(stats)
  } catch (err) {
    console.error('获取设备统计概览失败:', err)
    return success({ totalBookings: 0, totalHours: 0, activeDevices: 0, totalDevices: 0 })
  }
}
