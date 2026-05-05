import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { success, error, unauthorized, notFound, validationError, forbidden } from '@/lib/api/response'
import { notifyApprovalResult, notifyApprovalRequest } from '@/lib/notification'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

const approvalActionSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED', 'FORWARDED']),
  comment: z.string().optional(),
  forwardTo: z.string().uuid('无效的转交目标用户ID').optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request)
  if (!user) {
    return unauthorized('未授权，请先登录')
  }

  try {
    const { id: bookingId } = await params

    const booking = await prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        devices: { include: { device_types: true } },
        users: { select: { id: true, name: true } },
        projects: { select: { id: true, name: true } },
      },
    })

    if (!booking) {
      return notFound('预定不存在')
    }

    if (booking.status !== 'PENDING_APPROVAL') {
      return validationError('该预定不在待审批状态')
    }

    const body = await request.json()
    const data = approvalActionSchema.parse(body)

    const deviceTypeId = booking.devices.typeId
    const config = await prisma.approval_configs.findUnique({
      where: { deviceTypeId },
    })

    if (!config) {
      return error('NO_CONFIG', '该设备类型未配置审批流程')
    }

    // 验证用户是否为当前设备类型的审批人
    const approverIds = JSON.parse(config.approverIds) as string[][]
    const allApproverIds = approverIds.flat()

    // ADMIN 有审批权限
    if (user.role !== 'ADMIN' && !allApproverIds.includes(user.id)) {
      return forbidden('您不是该设备类型的审批人')
    }

    const existingRecords = await prisma.approval_records.findMany({
      where: { bookingId },
      orderBy: { level: 'asc' },
    })

    let currentLevel = 1
    if (existingRecords.length > 0) {
      const lastRecord = existingRecords[existingRecords.length - 1]
      if (lastRecord.action === 'APPROVED') {
        currentLevel = lastRecord.level + 1
      } else if (lastRecord.action === 'REJECTED' || lastRecord.action === 'FORWARDED') {
        return validationError('该预定已被审批，无法重复操作')
      }
    }

    if (currentLevel > config.levels) {
      return error('ALREADY_APPROVED', '审批流程已完成')
    }

    if (data.action === 'REJECTED') {
      await prisma.bookings.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      })

      await prisma.approval_records.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          approverId: user.id,
          level: currentLevel,
          action: 'REJECTED',
          comment: data.comment || '已驳回',
        },
      })

      if (booking.users) {
        await notifyApprovalResult(
          booking.users.id,
          bookingId,
          booking.devices.name,
          false,
          data.comment,
          booking.projectId || undefined
        )
      }

      return success({ action: 'REJECTED', bookingId }, '已驳回预定')
    }

    if (data.action === 'FORWARDED') {
      if (!data.forwardTo) {
        return validationError('转交操作需要指定目标审批人')
      }

      const targetUser = await prisma.users.findUnique({
        where: { id: data.forwardTo },
      })

      if (!targetUser) {
        return notFound('目标审批人不存在')
      }

      const currentLevelApprovers = approverIds[currentLevel - 1] || []
      if (!currentLevelApprovers.includes(data.forwardTo)) {
        return validationError('目标用户不在当前级别的审批人列表中')
      }

      await prisma.approval_records.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          approverId: user.id,
          level: currentLevel,
          action: 'FORWARDED',
          comment: data.comment || '已转交',
        },
      })

      await prisma.approval_records.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          approverId: data.forwardTo,
          level: currentLevel,
          action: 'PENDING',
        },
      })

      if (booking.users) {
        await notifyApprovalRequest(
          data.forwardTo,
          bookingId,
          booking.devices.name,
          booking.users.name,
          booking.projects?.name || '',
          booking.projectId || undefined
        )
      }

      return success({ action: 'FORWARDED', forwardedTo: data.forwardTo }, '已转交审批')
    }

    if (data.action === 'APPROVED') {
      await prisma.approval_records.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          approverId: user.id,
          level: currentLevel,
          action: 'APPROVED',
          comment: data.comment,
        },
      })

      if (currentLevel < config.levels) {
        const nextLevelApprovers = approverIds[currentLevel]
        if (nextLevelApprovers && nextLevelApprovers.length > 0) {
          for (const approverId of nextLevelApprovers) {
            await prisma.approval_records.create({
              data: {
                id: crypto.randomUUID(),
                bookingId,
                approverId,
                level: currentLevel + 1,
                action: 'PENDING',
              },
            })

            if (booking.users) {
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
        }

        return success({ action: 'APPROVED', nextLevel: currentLevel + 1 }, '已批准，需下一级审批')
      }

      await prisma.bookings.update({
        where: { id: bookingId },
        data: { status: 'RESERVED' },
      })

      if (booking.devices.status === 'AVAILABLE') {
        await prisma.devices.update({
          where: { id: booking.deviceId },
          data: { status: 'RESERVED' },
        })
      }

      if (booking.users) {
        await notifyApprovalResult(
          booking.users.id,
          bookingId,
          booking.devices.name,
          true,
          data.comment,
          booking.projectId || undefined
        )
      }

      return success({ action: 'APPROVED', completed: true }, '审批已完成，预定已确认')
    }

    return validationError('无效的审批操作')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return validationError(err.issues[0].message)
    }
    console.error('审批操作失败:', err)
    return error('ACTION_FAILED', '审批操作失败')
  }
}
