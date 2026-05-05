import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id } = await params
    const booking = await prisma.bookings.findUnique({
      where: { id },
      include: {
        devices: {
          include: { device_types: true },
        },
        users: { select: { id: true, name: true, email: true } },
        projects: { select: { id: true, name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: '预定不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error('获取预定失败:', error)
    return NextResponse.json({ success: false, error: '获取预定失败' }, { status: 500 })
  }
}
