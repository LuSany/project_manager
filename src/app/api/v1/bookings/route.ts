import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hasBookingConflict } from '@/lib/booking-conflict'
import { getApprovalConfigByDeviceType, startApprovalChain } from '@/lib/approval-flow'
import { checkWarningThresholds } from '@/lib/quota'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

const createBookingSchema = z
  .object({
    deviceId: z.string().min(1, '设备不能为空'),
    projectId: z.string().optional(),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), '无效的开始时间'),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), '无效的结束时间'),
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), '结束时间必须大于开始时间')

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const userId = searchParams.get('userId')
    const deviceId = searchParams.get('deviceId')
    const status = searchParams.get('status')

    const skip = (page - 1) * pageSize

    const where: any = {}
    if (userId) where.userId = userId
    if (deviceId) where.deviceId = deviceId
    if (status) where.status = status

    const [items, total] = await Promise.all([
      prisma.bookings.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          devices: {
            include: { device_types: { select: { name: true } } },
          },
          users: { select: { id: true, name: true } },
          projects: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.bookings.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('获取预定列表失败:', error)
    return NextResponse.json({ success: false, error: '获取预定列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)

    const device = await prisma.devices.findUnique({
      where: { id: validatedData.deviceId },
      include: { device_types: true },
    })

    if (!device) {
      return NextResponse.json({ success: false, error: '设备不存在' }, { status: 404 })
    }

    if (device.status === 'DISABLED') {
      return NextResponse.json({ success: false, error: '设备已停用，无法预定' }, { status: 400 })
    }

    if (device.status === 'MAINTENANCE') {
      return NextResponse.json({ success: false, error: '设备正在维护，无法预定' }, { status: 400 })
    }

    const existingBookings = await prisma.bookings.findMany({
      where: { deviceId: validatedData.deviceId },
      select: {
        startTime: true,
        endTime: true,
        status: true,
        users: { select: { id: true, name: true } },
        projects: { select: { id: true, name: true } },
      },
    })

    const conflictResult = hasBookingConflict(existingBookings, startTime, endTime)

    if (conflictResult.hasConflict) {
      const conflict = conflictResult.conflictingBooking
      return NextResponse.json(
        {
          success: false,
          error: '预定时间与现有预定冲突',
          data: {
            conflictingBooking: {
              startTime: conflict?.startTime,
              endTime: conflict?.endTime,
              userName: (conflict as any)?.users?.name || '未知用户',
              projectName: (conflict as any)?.projects?.name || '未关联项目',
            },
          },
        },
        { status: 409 }
      )
    }

    const config = await getApprovalConfigByDeviceType(device.device_types.id)
    const needsApproval = config !== null

    const booking = await prisma.bookings.create({
      data: {
        id: crypto.randomUUID(),
        deviceId: validatedData.deviceId,
        userId: user.id,
        projectId: validatedData.projectId,
        startTime,
        endTime,
        status: needsApproval ? ('PENDING_APPROVAL' as const) : ('RESERVED' as const),
      },
      include: {
        devices: { include: { device_types: true } },
        users: { select: { id: true, name: true } },
      },
    })

    const approvalInfo: { needsApproval: boolean; config?: typeof config } = {
      needsApproval: false,
    }
    if (needsApproval && config) {
      await startApprovalChain(booking.id, device.device_types.id)
      approvalInfo.needsApproval = true
      approvalInfo.config = config
    } else if (!needsApproval && device.status === 'AVAILABLE') {
      await prisma.devices.update({
        where: { id: validatedData.deviceId },
        data: { status: 'RESERVED' },
      })
    }

    // 检查配额并触发警告 (D-12, D-30)
    if (validatedData.projectId) {
      await checkWarningThresholds(validatedData.projectId)
    }

    return NextResponse.json({ success: true, data: { ...booking, approval: approvalInfo } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('创建预定失败:', error)
    return NextResponse.json({ success: false, error: '创建预定失败' }, { status: 500 })
  }
}
