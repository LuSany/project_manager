import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api/response'
import { getStatsOverview } from '@/lib/equipment-stats'
import { getAuthUser } from '@/lib/auth-helpers'

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
