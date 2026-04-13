import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import type {
  ProjectHoursParams,
  ProjectHoursItem,
  DeviceUtilizationParams,
  DeviceUtilizationItem,
  UsageRecordsParams,
  UsageRecordsResponse,
  UsageRecordItem,
  ExportParams,
  StatsOverview,
} from '@/types/equipment-stats'

const WORKING_HOURS_PER_DAY = 12

function getMonthDateRange(monthStr?: string): { start: Date; end: Date } {
  const now = new Date()
  const year = monthStr ? parseInt(monthStr.split('-')[0]) : now.getFullYear()
  const month = monthStr ? parseInt(monthStr.split('-')[1]) - 1 : now.getMonth()

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  return { start, end }
}

function calculateHours(startTime: Date, endTime: Date): number {
  const diff = endTime.getTime() - startTime.getTime()
  return Math.round((diff / 3600000) * 100) / 100
}

async function aggregateProjectHours(params: ProjectHoursParams): Promise<ProjectHoursItem[]> {
  const { month, topN = 10, deviceTypeId } = params as any
  const { start, end } = getMonthDateRange(month)

  const bookingWhere: any = {
    startTime: { gte: start },
    endTime: { lte: end },
    status: { in: ['RESERVED', 'IN_PROGRESS', 'COMPLETED'] },
    projectId: { not: null },
  }

  // 如果指定了设备类型，添加过滤条件
  if (deviceTypeId) {
    bookingWhere.devices = { typeId: deviceTypeId }
  }

  const bookings = await prisma.bookings.findMany({
    where: bookingWhere,
    include: {
      projects: { select: { id: true, name: true } },
      devices: {
        include: {
          device_types: { select: { id: true, name: true } },
        },
      },
    },
  })

  const projectMap = new Map<
    string,
    {
      projectId: string
      projectName: string
      totalHours: number
      bookingCount: number
      deviceTypeName?: string
      minHours: number
      maxHours: number
      avgHours: number
    }
  >()

  for (const booking of bookings) {
    if (!booking.projectId || !booking.projects) continue

    const hours = calculateHours(booking.startTime, booking.endTime)
    const existing = projectMap.get(booking.projectId)

    if (existing) {
      existing.totalHours += hours
      existing.bookingCount += 1
      existing.minHours = Math.min(existing.minHours, hours)
      existing.maxHours = Math.max(existing.maxHours, hours)
      existing.avgHours = existing.totalHours / existing.bookingCount
    } else {
      projectMap.set(booking.projectId, {
        projectId: booking.projectId,
        projectName: booking.projects.name,
        totalHours: hours,
        bookingCount: 1,
        deviceTypeName: booking.devices?.device_types?.name,
        minHours: hours,
        maxHours: hours,
        avgHours: hours,
      })
    }
  }

  const sorted = Array.from(projectMap.values()).sort((a, b) => b.totalHours - a.totalHours)

  return sorted.slice(0, topN).map((item) => ({
    ...item,
    avgHours: Math.round(item.avgHours * 100) / 100,
    minHours: Math.round(item.minHours * 100) / 100,
    maxHours: Math.round(item.maxHours * 100) / 100,
  }))
}

async function calculateDeviceUtilization(
  params: DeviceUtilizationParams
): Promise<DeviceUtilizationItem[]> {
  const { startDate, endDate, deviceTypeId } = params

  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const availableHours = daysDiff * WORKING_HOURS_PER_DAY

  const deviceWhere: any = {}
  if (deviceTypeId) {
    deviceWhere.typeId = deviceTypeId
  }

  const devices = await prisma.devices.findMany({
    where: deviceWhere,
    include: {
      device_types: { select: { id: true, name: true } },
      bookings: {
        where: {
          startTime: { gte: start },
          endTime: { lte: end },
          status: { in: ['RESERVED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      },
    },
  })

  const dailyTrendMap = new Map<string, number>()

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    dailyTrendMap.set(dateStr, 0)
  }

  const result: DeviceUtilizationItem[] = []

  for (const device of devices) {
    let usedHours = 0

    for (const booking of device.bookings) {
      const hours = calculateHours(booking.startTime, booking.endTime)
      usedHours += hours

      const dateStr = booking.startTime.toISOString().slice(0, 10)
      if (dailyTrendMap.has(dateStr)) {
        dailyTrendMap.set(dateStr, (dailyTrendMap.get(dateStr) || 0) + hours)
      }
    }

    const utilization =
      availableHours > 0 ? Math.round((usedHours / availableHours) * 10000) / 100 : 0

    result.push({
      deviceId: device.id,
      deviceName: device.name,
      deviceTypeName: device.device_types.name,
      utilization,
      usedHours: Math.round(usedHours * 100) / 100,
      availableHours,
      dailyTrend: Array.from(dailyTrendMap.entries()).map(([date, hours]) => ({
        date,
        hours: Math.round(hours * 100) / 100,
      })),
    })
  }

  return result
}

async function queryUsageRecords(params: UsageRecordsParams): Promise<UsageRecordsResponse> {
  const {
    projectId,
    deviceId,
    userId,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
    sortBy = 'startTime',
    sortOrder = 'desc',
  } = params

  const where: any = {
    status: { in: ['RESERVED', 'IN_PROGRESS', 'COMPLETED'] },
  }

  if (projectId) where.projectId = projectId
  if (deviceId) where.deviceId = deviceId
  if (userId) where.userId = userId
  if (startDate) where.startTime = { ...where.startTime, gte: new Date(startDate) }
  if (endDate) where.endTime = { ...where.endTime, lte: new Date(endDate) }

  const orderBy: any = {}
  orderBy[sortBy] = sortOrder

  const [items, total] = await Promise.all([
    prisma.bookings.findMany({
      where,
      include: {
        devices: { include: { device_types: { select: { name: true } } } },
        users: { select: { name: true } },
        projects: { select: { name: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bookings.count({ where }),
  ])

  const formattedItems: UsageRecordItem[] = items.map((item) => ({
    id: item.id,
    deviceName: item.devices.name,
    deviceTypeName: item.devices.device_types.name,
    projectName: item.projects?.name || null,
    userName: item.users.name,
    startTime: item.startTime.toISOString(),
    endTime: item.endTime.toISOString(),
    status: item.status,
    hours: calculateHours(item.startTime, item.endTime),
  }))

  return {
    items: formattedItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

async function getStatsOverview(): Promise<StatsOverview> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalBookings, bookingsWithHours, devices] = await Promise.all([
    prisma.bookings.count({
      where: {
        startTime: { gte: startOfMonth },
        status: { in: ['RESERVED', 'IN_PROGRESS', 'COMPLETED'] },
      },
    }),
    prisma.bookings.findMany({
      where: {
        startTime: { gte: startOfMonth },
        status: { in: ['RESERVED', 'IN_PROGRESS', 'COMPLETED'] },
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.devices.findMany({
      where: { status: { not: 'DISABLED' } },
    }),
  ])

  let totalHours = 0
  for (const booking of bookingsWithHours) {
    totalHours += calculateHours(booking.startTime, booking.endTime)
  }

  const activeDevices = devices.filter((d) => d.status !== 'DISABLED').length

  return {
    totalBookings,
    totalHours: Math.round(totalHours * 100) / 100,
    activeDevices,
    totalDevices: devices.length,
  }
}

async function generateExcelBuffer(params: ExportParams): Promise<Buffer> {
  const { type, month, startDate, endDate, projectId, deviceTypeId } = params

  const workbook = XLSX.utils.book_new()

  if (type === 'project-hours') {
    const items = await aggregateProjectHours({ month, topN: 1000, deviceTypeId } as any)

    // 项目机时汇总 Sheet
    const summaryHeaders = ['项目名称', '设备类型', '预定数量', '总使用时长(小时)', '平均单次时长(小时)', '最大单次时长(小时)', '最小单次时长(小时)']
    const summaryData = items.map((item: any) => ({
      '项目名称': item.projectName,
      '设备类型': item.deviceTypeName || '-',
      '预定数量': item.bookingCount,
      '总使用时长(小时)': item.totalHours,
      '平均单次时长(小时)': item.avgHours,
      '最大单次时长(小时)': item.maxHours,
      '最小单次时长(小时)': item.minHours,
    }))
    const summarySheet = XLSX.utils.json_to_sheet(summaryData, { header: summaryHeaders })
    XLSX.utils.book_append_sheet(workbook, summarySheet, '项目机时汇总')

    // 详细记录 Sheet
    const { start, end } = getMonthDateRange(month)
    const bookingWhere: any = {
      startTime: { gte: start },
      endTime: { lte: end },
      status: { in: ['RESERVED', 'IN_PROGRESS', 'COMPLETED'] },
    }
    if (deviceTypeId) bookingWhere.devices = { typeId: deviceTypeId }

    const bookings = await prisma.bookings.findMany({
      where: bookingWhere,
      include: {
        projects: { select: { name: true } },
        devices: { include: { device_types: { select: { name: true } } } },
        users: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
    })

    const detailHeaders = ['预定ID', '项目', '设备', '设备类型', '用户', '开始时间', '结束时间', '状态', '使用时长(小时)']
    const detailData = bookings.map((b: any) => ({
      '预定ID': b.id,
      '项目': b.projects?.name || '-',
      '设备': b.devices?.name || '-',
      '设备类型': b.devices?.device_types?.name || '-',
      '用户': b.users?.name || '-',
      '开始时间': b.startTime.toISOString().slice(0, 19).replace('T', ' '),
      '结束时间': b.endTime.toISOString().slice(0, 19).replace('T', ' '),
      '状态': b.status,
      '使用时长(小时)': calculateHours(b.startTime, b.endTime),
    }))
    const detailSheet = XLSX.utils.json_to_sheet(detailData, { header: detailHeaders })
    XLSX.utils.book_append_sheet(workbook, detailSheet, '详细记录')

  } else if (type === 'device-utilization') {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required for device-utilization export')
    }
    const items = await calculateDeviceUtilization({ startDate, endDate, deviceTypeId })

    // 设备使用率汇总 Sheet
    const summaryHeaders = ['设备名称', '设备类型', '使用时长(小时)', '可用时长(小时)', '使用率(%)', '预定次数']
    const summaryData = items.map((item: any) => ({
      '设备名称': item.deviceName,
      '设备类型': item.deviceTypeName,
      '使用时长(小时)': item.usedHours,
      '可用时长(小时)': item.availableHours,
      '使用率(%)': item.utilization,
      '预定次数': item.dailyTrend.reduce((sum: number, d: any) => sum + (d.hours > 0 ? 1 : 0), 0),
    }))
    const summarySheet = XLSX.utils.json_to_sheet(summaryData, { header: summaryHeaders })
    XLSX.utils.book_append_sheet(workbook, summarySheet, '设备使用率汇总')

    // 每日趋势 Sheet
    const trendHeaders = ['日期', '使用时长(小时)']
    const trendData = items.length > 0 ? items[0].dailyTrend.map((d: any) => ({
      '日期': d.date,
      '使用时长(小时)': d.hours,
    })) : []
    const trendSheet = XLSX.utils.json_to_sheet(trendData, { header: trendHeaders })
    XLSX.utils.book_append_sheet(workbook, trendSheet, '每日趋势')

  } else if (type === 'usage-record') {
    const result = await queryUsageRecords({
      projectId,
      startDate,
      endDate,
      page: 1,
      pageSize: 10000,
      sortBy: 'startTime',
      sortOrder: 'desc',
    })

    const headers = ['预定ID', '项目', '设备', '设备类型', '用户', '开始时间', '结束时间', '状态', '使用时长(小时)']
    const data = result.items.map((item) => ({
      '预定ID': item.id,
      '项目': item.projectName || '-',
      '设备': item.deviceName,
      '设备类型': item.deviceTypeName,
      '用户': item.userName,
      '开始时间': item.startTime.slice(0, 19).replace('T', ' '),
      '结束时间': item.endTime.slice(0, 19).replace('T', ' '),
      '状态': item.status,
      '使用时长(小时)': item.hours,
    }))
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers })
    XLSX.utils.book_append_sheet(workbook, worksheet, '使用记录')

  } else if (type === 'complete-report') {
    // Complete report with 3 sheets: project hours summary + device utilization + usage records
    const { start, end } = month
      ? getMonthDateRange(month)
      : { start: new Date(startDate || new Date()), end: new Date(endDate || new Date()) }

    // Sheet 1: Project Hours Summary
    const projectItems = await aggregateProjectHours({
      month,
      topN: 1000,
      deviceTypeId: deviceTypeId as any,
    } as any)

    const summaryHeaders = [
      '项目名称',
      '设备类型',
      '预定数量',
      '总使用时长(小时)',
      '平均单次时长(小时)',
      '最大单次时长(小时)',
      '最小单次时长(小时)',
    ]
    const summaryData = projectItems.map((item: any) => ({
      '项目名称': item.projectName,
      '设备类型': item.deviceTypeName || '-',
      '预定数量': item.bookingCount,
      '总使用时长(小时)': item.totalHours,
      '平均单次时长(小时)': item.avgHours,
      '最大单次时长(小时)': item.maxHours,
      '最小单次时长(小时)': item.minHours,
    }))
    const summarySheet = XLSX.utils.json_to_sheet(summaryData, { header: summaryHeaders })
    XLSX.utils.book_append_sheet(workbook, summarySheet, '项目机时汇总')

    // Sheet 2: Device Utilization Summary
    const deviceItems = await calculateDeviceUtilization({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      deviceTypeId,
    })

    const deviceHeaders = ['设备名称', '设备类型', '使用时长(小时)', '可用时长(小时)', '使用率(%)', '预定次数']
    const deviceData = deviceItems.map((item: any) => ({
      '设备名称': item.deviceName,
      '设备类型': item.deviceTypeName,
      '使用时长(小时)': item.usedHours,
      '可用时长(小时)': item.availableHours,
      '使用率(%)': item.utilization,
      '预定次数': item.dailyTrend.reduce((sum: number, d: any) => sum + (d.hours > 0 ? 1 : 0), 0),
    }))
    const deviceSheet = XLSX.utils.json_to_sheet(deviceData, { header: deviceHeaders })
    XLSX.utils.book_append_sheet(workbook, deviceSheet, '设备使用率汇总')

    // Sheet 3: Detailed Usage Records
    const bookingWhere: any = {
      startTime: { gte: start },
      endTime: { lte: end },
      status: { in: ['RESERVED', 'IN_PROGRESS', 'COMPLETED'] },
    }
    if (deviceTypeId) bookingWhere.devices = { typeId: deviceTypeId }
    if (projectId) bookingWhere.projectId = projectId

    const bookings = await prisma.bookings.findMany({
      where: bookingWhere,
      include: {
        projects: { select: { name: true } },
        devices: { include: { device_types: { select: { name: true } } } },
        users: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
    })

    const detailHeaders = [
      '预定ID',
      '项目',
      '设备',
      '设备类型',
      '用户',
      '开始时间',
      '结束时间',
      '状态',
      '使用时长(小时)',
    ]
    const detailData = bookings.map((b: any) => ({
      '预定ID': b.id,
      '项目': b.projects?.name || '-',
      '设备': b.devices?.name || '-',
      '设备类型': b.devices?.device_types?.name || '-',
      '用户': b.users?.name || '-',
      '开始时间': b.startTime.toISOString().slice(0, 19).replace('T', ' '),
      '结束时间': b.endTime.toISOString().slice(0, 19).replace('T', ' '),
      '状态': b.status,
      '使用时长(小时)': calculateHours(b.startTime, b.endTime),
    }))
    const detailSheet = XLSX.utils.json_to_sheet(detailData, { header: detailHeaders })
    XLSX.utils.book_append_sheet(workbook, detailSheet, '详细使用记录')
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  return buffer
}

export {
  aggregateProjectHours,
  calculateDeviceUtilization,
  queryUsageRecords,
  getStatsOverview,
  generateExcelBuffer,
}
