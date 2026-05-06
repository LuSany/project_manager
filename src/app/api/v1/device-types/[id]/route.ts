import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth-helpers'

const updateDeviceTypeSchema = z.object({
  name: z.string().min(1).optional(),
  modelName: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
})

// GET /api/v1/device-types/[id] - Get single device type
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const deviceType = await prisma.device_types.findUnique({
      where: { id },
      include: {
        devices: {
          select: { id: true, name: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!deviceType) {
      return NextResponse.json({ success: false, error: '设备类型不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: deviceType })
  } catch (error) {
    console.error('获取设备类型失败:', error)
    return NextResponse.json({ success: false, error: '获取设备类型失败' }, { status: 500 })
  }
}

// PUT /api/v1/device-types/[id] - Update device type
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  // 只有管理员可以更新设备类型
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '此操作需要管理员权限' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateDeviceTypeSchema.parse(body)

    // If name is being updated, check for duplicate
    if (validatedData.name) {
      const existing = await prisma.device_types.findFirst({
        where: { name: validatedData.name, id: { not: id } },
      })
      if (existing) {
        return NextResponse.json({ success: false, error: '设备类型名称已存在' }, { status: 400 })
      }
    }

    const deviceType = await prisma.device_types.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ success: true, data: deviceType })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('更新设备类型失败:', error)
    return NextResponse.json({ success: false, error: '更新设备类型失败' }, { status: 500 })
  }
}

// DELETE /api/v1/device-types/[id] - Delete device type
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

    // Check if device type has devices
    const devicesCount = await prisma.devices.count({
      where: { typeId: id },
    })

    if (devicesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `该设备类型下有 ${devicesCount} 个设备，无法删除`,
        },
        { status: 400 }
      )
    }

    await prisma.device_types.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('删除设备类型失败:', error)
    return NextResponse.json({ success: false, error: '删除设备类型失败' }, { status: 500 })
  }
}
