import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success } from '@/lib/api/response'
import { calculateDeviceUtilization } from '@/lib/equipment-stats'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return success([])
  }

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const deviceTypeId = searchParams.get('deviceTypeId') || undefined

    if (!startDate || !endDate) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const endOfMonth = now.toISOString().slice(0, 10)

      const result = await calculateDeviceUtilization({
        startDate: startOfMonth,
        endDate: endOfMonth,
        deviceTypeId,
      })
      return success(result)
    }

    const result = await calculateDeviceUtilization({ startDate, endDate, deviceTypeId })
    return success(result)
  } catch (err) {
    console.error('获取设备使用率统计失败:', err)
    return success([])
  }
}
