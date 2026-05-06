import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helpers'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params

    const booking = await prisma.bookings.findUnique({
      where: { id },
      include: { devices: true },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: '预定不存在' }, { status: 404 })
    }

    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: '无权取消此预定' }, { status: 403 })
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: '已完成的预定无法取消' }, { status: 400 })
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: '预定已取消' }, { status: 400 })
    }

    if (booking.status === 'IN_PROGRESS') {
      return NextResponse.json({ success: false, error: '使用中的预定无法取消' }, { status: 400 })
    }

    const updatedBooking = await prisma.bookings.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    const remainingActiveBookings = await prisma.bookings.count({
      where: {
        deviceId: booking.deviceId,
        status: { in: ['RESERVED', 'IN_PROGRESS'] },
      },
    })

    if (remainingActiveBookings === 0 && booking.devices.status === 'RESERVED') {
      await prisma.devices.update({
        where: { id: booking.deviceId },
        data: { status: 'AVAILABLE' },
      })
    }

    return NextResponse.json({ success: true, data: updatedBooking })
  } catch (error) {
    console.error('取消预定失败:', error)
    return NextResponse.json({ success: false, error: '取消预定失败' }, { status: 500 })
  }
}
