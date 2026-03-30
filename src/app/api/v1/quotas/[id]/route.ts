import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { updateQuotaSchema } from '@/types/quota'
import { validateSubQuotas } from '@/lib/quota'
import { z } from 'zod'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await prisma.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

function formatQuotaResponse(quota: any) {
  return {
    id: quota.id,
    projectId: quota.projectId,
    totalHours: quota.totalHours,
    period: quota.period,
    warningSent50: quota.warningSent50,
    warningSent80: quota.warningSent80,
    warningSent100: quota.warningSent100,
    subItems:
      quota.subItems?.map((item: any) => ({
        id: item.id,
        quotaId: item.quotaId,
        deviceTypeId: item.deviceTypeId,
        subHours: item.subHours,
        deviceTypeName: item.device_types?.name,
      })) || [],
    createdAt: quota.createdAt.toISOString(),
    updatedAt: quota.updatedAt.toISOString(),
    projectName: quota.projects?.name,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    const userId = request.cookies.get('user-id')?.value
    if (!userId) return error('UNAUTHORIZED', '未授权访问', undefined, 401)
    return error('FORBIDDEN', '只有管理员可以访问配额详情', undefined, 403)
  }

  try {
    const { id } = await params

    const quota = await prisma.quotas.findUnique({
      where: { id },
      include: {
        subItems: {
          include: {
            device_types: {
              select: { name: true },
            },
          },
        },
        projects: {
          select: { name: true },
        },
      },
    })

    if (!quota) {
      return error('NOT_FOUND', '配额不存在', undefined, 404)
    }

    return success(formatQuotaResponse(quota))
  } catch (err) {
    console.error('获取配额失败:', err)
    return error('FETCH_ERROR', '获取配额失败', undefined, 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    const userId = request.cookies.get('user-id')?.value
    if (!userId) return error('UNAUTHORIZED', '未授权访问', undefined, 401)
    return error('FORBIDDEN', '只有管理员可以更新配额', undefined, 403)
  }

  try {
    const { id } = await params
    const body = await request.json()
    const data = updateQuotaSchema.parse(body)

    const existingQuota = await prisma.quotas.findUnique({ where: { id } })
    if (!existingQuota) {
      return error('NOT_FOUND', '配额不存在', undefined, 404)
    }

    if (data.subItems && data.totalHours) {
      const validation = validateSubQuotas(data.totalHours, data.subItems)
      if (!validation.valid) {
        return error('VALIDATION_ERROR', validation.error, undefined, 400)
      }
    } else if (data.subItems) {
      const validation = validateSubQuotas(existingQuota.totalHours, data.subItems)
      if (!validation.valid) {
        return error('VALIDATION_ERROR', validation.error, undefined, 400)
      }
    }

    const updateData: any = { ...data }
    if (data.totalHours) {
      updateData.warningSent50 = false
      updateData.warningSent80 = false
      updateData.warningSent100 = false
    }
    delete updateData.subItems

    const quota = await prisma.quotas.update({
      where: { id },
      data: updateData,
    })

    if (data.subItems) {
      await prisma.quota_sub_items.deleteMany({ where: { quotaId: id } })
      await prisma.quota_sub_items.createMany({
        data: data.subItems.map((item) => ({
          id: crypto.randomUUID(),
          quotaId: id,
          deviceTypeId: item.deviceTypeId,
          subHours: item.subHours,
        })),
      })
    }

    const result = await prisma.quotas.findUnique({
      where: { id },
      include: {
        subItems: {
          include: {
            device_types: {
              select: { name: true },
            },
          },
        },
        projects: {
          select: { name: true },
        },
      },
    })

    return success(result ? formatQuotaResponse(result) : null)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', err.issues[0].message, undefined, 400)
    }
    console.error('更新配额失败:', err)
    return error('UPDATE_ERROR', '更新配额失败', undefined, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    const userId = request.cookies.get('user-id')?.value
    if (!userId) return error('UNAUTHORIZED', '未授权访问', undefined, 401)
    return error('FORBIDDEN', '只有管理员可以删除配额', undefined, 403)
  }

  try {
    const { id } = await params

    const quota = await prisma.quotas.findUnique({ where: { id } })
    if (!quota) {
      return error('NOT_FOUND', '配额不存在', undefined, 404)
    }

    await prisma.quotas.delete({ where: { id } })

    return success({ deleted: true })
  } catch (err) {
    console.error('删除配额失败:', err)
    return error('DELETE_ERROR', '删除配额失败', undefined, 500)
  }
}
