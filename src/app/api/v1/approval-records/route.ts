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
              devices: { include: { device_types: { select: { id: true, name: true } } } },
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

    const recordsWhere: any = {}

    if (status === 'PENDING') {
      // 获取当前用户可审批的设备类型
      // approverIds 存储为 JSON 字符串 string[][]，需要解析检查用户是否在其中
      const allApprovalConfigs = await db.approval_configs.findMany({
        select: {
          deviceTypeId: true,
          approverIds: true,
        },
      })

      // 解析 approverIds，找出用户可审批的设备类型
      const myDeviceTypeIds: string[] = []
      for (const config of allApprovalConfigs) {
        try {
          const approverIdsArray = JSON.parse(config.approverIds) as string[][]
          const allApproverIds = approverIdsArray.flat()
          if (allApproverIds.includes(user.id)) {
            myDeviceTypeIds.push(config.deviceTypeId)
          }
        } catch {
          // JSON 解析失败，跳过此配置
          continue
        }
      }

      // 如果用户没有任何审批权限，返回空列表
      if (myDeviceTypeIds.length === 0) {
        return success({
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        })
      }

      // 获取这些设备类型的待审批预订
      const pendingBookings = await db.bookings.findMany({
        where: {
          status: 'PENDING_APPROVAL',
          devices: { typeId: { in: myDeviceTypeIds } },
        },
        select: { id: true },
      })

      const pendingBookingIds = pendingBookings.map((b) => b.id)

      // 获取当前用户已处理的预订（无论通过还是驳回）
      // 注意：approval_records 表只存储已处理记录，但需要排除可能的 PENDING 记录
      const processedRecords = await db.approval_records.findMany({
        where: {
          approverId: user.id,
          action: { not: 'PENDING' }  // 排除 PENDING 记录，确保只取已处理记录
        },
        select: { bookingId: true },
      })
      const processedBookingIds = processedRecords.map((r) => r.bookingId)

      // 过滤出用户未处理的待审批预订
      const availableBookingIds = pendingBookingIds.filter(
        (id) => !processedBookingIds.includes(id)
      )

      // 返回这些预订对应的审批记录（实际上需要返回预订信息）
      // 由于 approval_records 表只存储已处理的记录，待审批的记录没有审批记录
      // 这里我们直接返回预订信息，以 booking 包装成类似审批记录的格式
      const pendingItems = await db.bookings.findMany({
        where: { id: { in: availableBookingIds } },
        skip,
        take: pageSize,
        include: {
          devices: {
            include: { device_types: { select: { name: true } } },
          },
          users: { select: { id: true, name: true } },
          projects: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      // 将预订转换为审批记录格式（添加虚拟字段）
      const formattedPendingItems = pendingItems.map((booking) => ({
        id: `pending-${booking.id}`,
        bookingId: booking.id,
        action: 'PENDING',
        comment: null,
        approverId: null,
        createdAt: booking.createdAt,
        bookings: {
          id: booking.id,
          deviceId: booking.deviceId,
          userId: booking.userId,
          projectId: booking.projectId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          createdAt: booking.createdAt,
          devices: booking.devices,
          users: booking.users,
          projects: booking.projects,
        },
        users: null,
      }))

      return success({
        items: formattedPendingItems,
        total: availableBookingIds.length,
        page,
        pageSize,
        totalPages: Math.ceil(availableBookingIds.length / pageSize),
      })
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
              devices: { include: { device_types: { select: { id: true, name: true } } } },
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
