import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

const updateStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'DISABLED']),
})

// PATCH /api/v1/devices/[id]/status - Update device status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    const device = await db.devices.findUnique({ where: { id } })
    if (!device) {
      return NextResponse.json({ success: false, error: '设备不存在' }, { status: 404 })
    }

    // Validate status transitions
    const currentStatus = device.status

    // Cannot set to DISABLED if has active bookings
    if (validatedData.status === 'DISABLED') {
      const activeBookings = await db.bookings.count({
        where: { deviceId: id, status: { in: ['RESERVED', 'IN_PROGRESS'] } },
      })
      if (activeBookings > 0) {
        return NextResponse.json(
          {
            success: false,
            error: '设备有活跃预定，无法停用',
          },
          { status: 400 }
        )
      }
    }

    // Cannot set to AVAILABLE if currently IN_USE (should end booking first)
    if (currentStatus === 'IN_USE' && validatedData.status === 'AVAILABLE') {
      // This should be handled by booking completion, not manual status change
      return NextResponse.json(
        {
          success: false,
          error: '使用中的设备应通过结束预定来恢复可用状态',
        },
        { status: 400 }
      )
    }

    const updatedDevice = await db.devices.update({
      where: { id },
      data: { status: validatedData.status },
      include: { device_types: { select: { name: true } } },
    })

    return NextResponse.json({ success: true, data: updatedDevice })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('更新设备状态失败:', error)
    return NextResponse.json({ success: false, error: '更新设备状态失败' }, { status: 500 })
  }
}
