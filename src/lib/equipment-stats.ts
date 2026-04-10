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
    { projectId: string; projectName: string; totalHours: number; bookingCount: number; deviceTypeName?: string }
  >()

  for (const booking of bookings) {
    if (!booking.projectId || !booking.projects) continue

    const hours = calculateHours(booking.startTime, booking.endTime)
    const existing = projectMap.get(booking.projectId)

    if (existing) {
      existing.totalHours += hours
      existing.bookingCount += 1
    } else {
      projectMap.set(booking.projectId, {
        projectId: booking.projectId,
        projectName: booking.projects.name,
        totalHours: hours,
        bookingCount: 1,
        deviceTypeName: booking.devices?.device_types?.name,
      })
    }
  }

  const sorted = Array.from(projectMap.values()).sort((a, b) => b.totalHours - a.totalHours)

  return sorted.slice(0, topN)
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

  let data: any[] = []
  const headers = [
    '项目',
    '设备',
    '设备类型',
    '用户',
    '开始时间',
    '结束时间',
    '状态',
    '使用时长(小时)',
  ]

  if (type === 'project-hours') {
    const items = await aggregateProjectHours({ month, topN: 1000 })
    data = items.map((item) => ({
      项目: item.projectName,
      设备: '-',
      设备类型: '-',
      用户: '-',
      开始时间: '-',
      结束时间: '-',
      状态: '-',
      '使用时长(小时)': item.totalHours,
    }))
  } else if (type === 'device-utilization') {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required for device-utilization export')
    }
    const items = await calculateDeviceUtilization({ startDate, endDate, deviceTypeId })
    data = items.map((item) => ({
      项目: '-',
      设备: item.deviceName,
      设备类型: item.deviceTypeName,
      用户: '-',
      开始时间: '-',
      结束时间: '-',
      状态: '-',
      '使用时长(小时)': item.usedHours,
    }))
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
    data = result.items.map((item) => ({
      项目: item.projectName || '-',
      设备: item.deviceName,
      设备类型: item.deviceTypeName,
      用户: item.userName,
      开始时间: item.startTime,
      结束时间: item.endTime,
      状态: item.status,
      '使用时长(小时)': item.hours,
    }))
  }

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stats')

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
