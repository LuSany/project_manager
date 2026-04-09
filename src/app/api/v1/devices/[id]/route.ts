import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

const updateDeviceSchema = z.object({
  name: z.string().min(1).optional(),
  typeId: z.string().optional(),
  modelName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'DISABLED']).optional(),
})

// GET /api/v1/devices/[id] - Get single device
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const device = await db.devices.findUnique({
      where: { id },
      include: {
        device_types: true,
        bookings: {
          where: { status: { in: ['RESERVED', 'IN_PROGRESS'] } },
          include: {
            users: { select: { id: true, name: true } },
            projects: { select: { id: true, name: true } },
          },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
      },
    })

    if (!device) {
      return NextResponse.json({ success: false, error: '设备不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: device })
  } catch (error) {
    console.error('获取设备失败:', error)
    return NextResponse.json({ success: false, error: '获取设备失败' }, { status: 500 })
  }
}

// PUT /api/v1/devices/[id] - Update device
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateDeviceSchema.parse(body)

    if (validatedData.typeId) {
      const deviceType = await db.device_types.findUnique({
        where: { id: validatedData.typeId },
      })
      if (!deviceType) {
        return NextResponse.json({ success: false, error: '设备类型不存在' }, { status: 400 })
      }
    }

    const device = await db.devices.update({
      where: { id },
      data: validatedData,
      include: { device_types: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: device })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('更新设备失败:', error)
    return NextResponse.json({ success: false, error: '更新设备失败' }, { status: 500 })
  }
}

// DELETE /api/v1/devices/[id] - Delete device
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check for active bookings
    const activeBookings = await db.bookings.count({
      where: { deviceId: id, status: { in: ['RESERVED', 'IN_PROGRESS'] } },
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `该设备有 ${activeBookings} 个活跃预定，无法删除`,
        },
        { status: 400 }
      )
    }

    await db.devices.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('删除设备失败:', error)
    return NextResponse.json({ success: false, error: '删除设备失败' }, { status: 500 })
  }
}
