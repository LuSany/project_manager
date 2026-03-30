import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, error, unauthorized, notFound } from '@/lib/api/response'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return unauthorized('未授权，请先登录')
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const bookingId = searchParams.get('bookingId')
    const approverId = searchParams.get('approverId')

    const skip = (page - 1) * pageSize

    if (bookingId) {
      const records = await db.approval_records.findMany({
        where: { bookingId },
        include: {
          bookings: {
            include: {
              devices: { include: { device_types: { select: { name: true } } } },
              users: { select: { id: true, name: true } },
              projects: { select: { id: true, name: true } },
            },
          },
          users: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return success({ items: records, total: records.length })
    }

    const bookingsWithPendingApproval = await db.bookings.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: { id: true },
    })

    const pendingBookingIds = bookingsWithPendingApproval.map((b) => b.id)

    const recordsWhere: any = {}

    if (status === 'PENDING') {
      recordsWhere.bookingId = { in: pendingBookingIds }
      const approverConfigs = await db.approval_configs.findMany()
      const pendingRecords = await db.approval_records.findMany({
        where: { approverId: user.id },
        select: { bookingId: true },
      })
      const processedBookingIds = pendingRecords.map((r) => r.bookingId)
      recordsWhere.bookingId = {
        in: pendingBookingIds.filter((id) => !processedBookingIds.includes(id)),
      }
    } else if (status === 'APPROVED' || status === 'REJECTED') {
      recordsWhere.action = status
    }

    if (approverId) {
      recordsWhere.approverId = approverId
    }

    const [items, total] = await Promise.all([
      db.approval_records.findMany({
        where: recordsWhere,
        skip,
        take: pageSize,
        include: {
          bookings: {
            include: {
              devices: { include: { device_types: { select: { name: true } } } },
              users: { select: { id: true, name: true } },
              projects: { select: { id: true, name: true } },
            },
          },
          users: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.approval_records.count({ where: recordsWhere }),
    ])

    return success({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('获取审批记录列表失败:', err)
    return error('FETCH_FAILED', '获取审批记录列表失败')
  }
}
