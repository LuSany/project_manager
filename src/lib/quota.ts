import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'
import { notifyQuotaWarning } from '@/lib/notification'
import { Prisma } from '@prisma/client'

export interface QuotaUsage {
  usedHours: number
  totalHours: number
  percentage: number
  subQuotaBreakdown: Record<string, number> | null
}

export interface QuotaBreakdownResult {
  usedHours: number
  totalHours: number
  percentage: number
  subQuotaBreakdown: Record<string, number> | null
  remainingHours: number
}

export interface SubQuotaItem {
  deviceTypeId: string
  subHours: number
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function calculateRemainingHours(totalHours: number, usedHours: number): number {
  return Math.max(0, totalHours - usedHours)
}

export function calculatePercentage(usedHours: number, totalHours: number): number {
  if (totalHours === 0) return 0
  const percentage = (usedHours / totalHours) * 100
  if (percentage >= 100) return 100
  return Math.round(percentage * 10) / 10
}

export function validateSubQuotas(totalHours: number, subItems: SubQuotaItem[]): ValidationResult {
  if (!subItems || subItems.length === 0) {
    return { valid: true }
  }

  for (const item of subItems) {
    if (item.subHours <= 0) {
      return { valid: false, error: '子配额必须大于 0' }
    }
  }

  const totalSub = subItems.reduce((sum, item) => sum + item.subHours, 0)
  if (totalSub > totalHours) {
    return { valid: false, error: `子配额总和(${totalSub})不能超过总配额(${totalHours})` }
  }

  return { valid: true }
}

export async function checkQuotaUsage(projectId: string): Promise<QuotaUsage> {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const quota = await prisma.quotas.findUnique({
    where: { projectId },
    include: {
      subItems: {
        include: {
          device_types: {
            select: { name: true },
          },
        },
      },
    },
  })

  if (!quota) {
    return {
      usedHours: 0,
      totalHours: 0,
      percentage: 0,
      subQuotaBreakdown: null,
    }
  }

  const bookings = await prisma.bookings.findMany({
    where: {
      projectId,
      status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      endTime: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  })

  const usedHours = bookings.reduce((total, booking) => {
    const durationMs = booking.endTime.getTime() - booking.startTime.getTime()
    const hours = durationMs / 3600000
    return total + hours
  }, 0)

  const subQuotaBreakdown =
    quota.subItems.length > 0
      ? quota.subItems.reduce(
          (acc, item) => {
            acc[item.deviceTypeId] = item.subHours
            return acc
          },
          {} as Record<string, number>
        )
      : null

  const percentage = calculatePercentage(usedHours, quota.totalHours)

  return {
    usedHours,
    totalHours: quota.totalHours,
    percentage,
    subQuotaBreakdown,
  }
}

export async function getQuotaBreakdown(projectId: string): Promise<QuotaBreakdownResult | null> {
  const usage = await checkQuotaUsage(projectId)

  if (usage.totalHours === 0) {
    return null
  }

  return {
    ...usage,
    remainingHours: calculateRemainingHours(usage.totalHours, usage.usedHours),
  }
}

export async function checkWarningThresholds(projectId: string): Promise<void> {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const quota = await prisma.quotas.findUnique({
    where: { projectId },
    include: {
      projects: {
        select: { name: true, ownerId: true },
      },
      subItems: true,
    },
  })

  if (!quota || quota.totalHours === 0) {
    return
  }

  const bookings = await prisma.bookings.findMany({
    where: {
      projectId,
      status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      endTime: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  })

  const usedHours = bookings.reduce((total, booking) => {
    const durationMs = booking.endTime.getTime() - booking.startTime.getTime()
    const hours = durationMs / 3600000
    return total + hours
  }, 0)

  const percentage = calculatePercentage(usedHours, quota.totalHours)

  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    select: { name: true, ownerId: true },
  })

  if (!project) return

  const notificationRecipients = new Set<string>()
  if (project.ownerId) {
    notificationRecipients.add(project.ownerId)
  }

  const projectMembers = await prisma.project_members.findMany({
    where: { projectId },
    select: { userId: true },
  })
  projectMembers.forEach((m) => notificationRecipients.add(m.userId))

  const updateData: Record<string, boolean> = {}
  let shouldUpdate = false

  if (percentage >= 50 && !quota.warningSent50) {
    for (const userId of notificationRecipients) {
      await notifyQuotaWarning(
        userId,
        project.name,
        usedHours,
        quota.totalHours,
        percentage,
        projectId
      )
    }
    updateData.warningSent50 = true
    shouldUpdate = true
  }

  if (percentage >= 80 && !quota.warningSent80) {
    updateData.warningSent80 = true
    shouldUpdate = true
  }

  if (percentage >= 100 && !quota.warningSent100) {
    updateData.warningSent100 = true
    shouldUpdate = true
  }

  if (shouldUpdate && Object.keys(updateData).length > 0) {
    await prisma.quotas.update({
      where: { id: quota.id },
      data: updateData,
    })
  }
}

export async function checkAndUpdateQuotaWarnings(
  projectId: string,
  newUsageHours: number
): Promise<void> {
  const quota = await prisma.quotas.findUnique({
    where: { projectId },
    include: {
      projects: {
        select: { name: true, ownerId: true },
      },
    },
  })

  if (!quota) return

  const currentUsage = await checkQuotaUsage(projectId)
  const newTotalUsage = currentUsage.usedHours + newUsageHours
  const newPercentage = calculatePercentage(newTotalUsage, quota.totalHours)

  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    select: { name: true, ownerId: true },
  })

  if (!project) return

  const notificationRecipients = new Set<string>()
  if (project.ownerId) {
    notificationRecipients.add(project.ownerId)
  }

  const projectMembers = await prisma.project_members.findMany({
    where: { projectId },
    select: { userId: true },
  })
  projectMembers.forEach((m) => notificationRecipients.add(m.userId))

  const updateData: Record<string, boolean> = {}
  let shouldUpdate = false

  if (newPercentage >= 50 && !quota.warningSent50) {
    for (const userId of notificationRecipients) {
      await notifyQuotaWarning(
        userId,
        project.name,
        newTotalUsage,
        quota.totalHours,
        newPercentage,
        projectId
      )
    }
    updateData.warningSent50 = true
    shouldUpdate = true
  }

  if (newPercentage >= 80 && !quota.warningSent80) {
    for (const userId of notificationRecipients) {
      await notifyQuotaWarning(
        userId,
        project.name,
        newTotalUsage,
        quota.totalHours,
        newPercentage,
        projectId
      )
    }
    updateData.warningSent80 = true
    shouldUpdate = true
  }

  if (newPercentage >= 100 && !quota.warningSent100) {
    for (const userId of notificationRecipients) {
      await notifyQuotaWarning(
        userId,
        project.name,
        newTotalUsage,
        quota.totalHours,
        newPercentage,
        projectId
      )
    }
    updateData.warningSent100 = true
    shouldUpdate = true
  }

  if (shouldUpdate && Object.keys(updateData).length > 0) {
    await prisma.quotas.update({
      where: { id: quota.id },
      data: updateData,
    })
  }
}
