import { prisma } from '@/lib/prisma'
import { notifyApprovalRequest, notifyApprovalResult } from '@/lib/notification'

export interface ApprovalConfig {
  id: string
  deviceTypeId: string
  levels: number
  approverIds: string[][]
  device_types?: { id: string; name: string }
}

export interface ApprovalRecord {
  id: string
  bookingId: string
  approverId: string
  level: number
  action: string
  comment?: string
  createdAt: Date
}

export async function getApprovalConfigByDeviceType(
  deviceTypeId: string
): Promise<ApprovalConfig | null> {
  const config = await prisma.approval_configs.findUnique({
    where: { deviceTypeId },
    include: { device_types: { select: { id: true, name: true } } },
  })

  if (!config) return null

  return {
    ...config,
    approverIds: JSON.parse(config.approverIds) as string[][],
  }
}

export async function getApprovalRecordsByBooking(bookingId: string): Promise<ApprovalRecord[]> {
  return prisma.approval_records.findMany({
    where: { bookingId },
    orderBy: { level: 'asc' },
  })
}

export async function getApprovalChainStatus(
  bookingId: string,
  deviceTypeId: string
): Promise<{
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FORWARDED' | 'NO_CONFIG' | 'NOT_STARTED'
  currentLevel: number
  totalLevels: number
  config?: ApprovalConfig
} | null> {
  const config = await getApprovalConfigByDeviceType(deviceTypeId)

  if (!config) {
    return { status: 'NO_CONFIG', currentLevel: 0, totalLevels: 0 }
  }

  const records = await getApprovalRecordsByBooking(bookingId)

  if (records.length === 0) {
    return { status: 'NOT_STARTED', currentLevel: 1, totalLevels: config.levels, config }
  }

  const lastRecord = records[records.length - 1]

  if (lastRecord.action === 'REJECTED') {
    return {
      status: 'REJECTED',
      currentLevel: lastRecord.level,
      totalLevels: config.levels,
      config,
    }
  }

  if (lastRecord.action === 'APPROVED') {
    if (lastRecord.level >= config.levels) {
      return {
        status: 'APPROVED',
        currentLevel: lastRecord.level,
        totalLevels: config.levels,
        config,
      }
    }
    return {
      status: 'PENDING',
      currentLevel: lastRecord.level + 1,
      totalLevels: config.levels,
      config,
    }
  }

  if (lastRecord.action === 'FORWARDED') {
    return {
      status: 'FORWARDED',
      currentLevel: lastRecord.level,
      totalLevels: config.levels,
      config,
    }
  }

  return { status: 'PENDING', currentLevel: lastRecord.level, totalLevels: config.levels, config }
}

export async function startApprovalChain(
  bookingId: string,
  deviceTypeId: string
): Promise<{
  success: boolean
  message: string
  config?: ApprovalConfig
}> {
  const config = await getApprovalConfigByDeviceType(deviceTypeId)

  if (!config) {
    return { success: true, message: 'No approval config, auto-approved', config: undefined }
  }

  await prisma.bookings.update({
    where: { id: bookingId },
    data: { status: 'PENDING_APPROVAL' },
  })

  const level1Approvers = config.approverIds[0] || []

  for (const approverId of level1Approvers) {
    await prisma.approval_records.create({
      data: {
        id: crypto.randomUUID(),
        bookingId,
        approverId,
        level: 1,
        action: 'PENDING',
      },
    })
  }

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      devices: true,
      users: { select: { id: true, name: true } },
      projects: { select: { id: true, name: true } },
    },
  })

  if (booking && booking.users) {
    for (const approverId of level1Approvers) {
      await notifyApprovalRequest(
        approverId,
        bookingId,
        booking.devices.name,
        booking.users.name,
        booking.projects?.name || '',
        booking.projectId || undefined
      )
    }
  }

  return { success: true, message: 'Approval chain started', config }
}

export async function forwardApproval(
  bookingId: string,
  currentLevel: number,
  forwardToUserId: string
): Promise<{ success: boolean; message: string }> {
  const config = await prisma.approval_configs.findUnique({
    where: {
      deviceTypeId:
        (await prisma.bookings.findUnique({ where: { id: bookingId }, include: { devices: true } }))
          ?.devices.typeId || '',
    },
  })

  if (!config) {
    return { success: false, message: 'No approval config found' }
  }

  const currentLevelApprovers = JSON.parse(config.approverIds)[currentLevel - 1] || []

  if (!currentLevelApprovers.includes(forwardToUserId)) {
    return { success: false, message: 'Target user is not in the approver list for this level' }
  }

  await prisma.approval_records.create({
    data: {
      id: crypto.randomUUID(),
      bookingId,
      approverId: forwardToUserId,
      level: currentLevel,
      action: 'FORWARDED',
    },
  })

  return { success: true, message: 'Approval forwarded successfully' }
}
