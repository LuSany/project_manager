import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { createQuotaSchema } from '@/types/quota'
import { validateSubQuotas } from '@/lib/quota'
import { z } from 'zod'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await prisma.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    const userId = request.cookies.get('user-id')?.value
    if (!userId) return error('UNAUTHORIZED', '未授权访问', undefined, 401)
    return error('FORBIDDEN', '只有管理员可以访问配额列表', undefined, 403)
  }

  try {
    const quotas = await prisma.quotas.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    const formattedQuotas = quotas.map((q) => ({
      id: q.id,
      projectId: q.projectId,
      totalHours: q.totalHours,
      period: q.period,
      warningSent50: q.warningSent50,
      warningSent80: q.warningSent80,
      warningSent100: q.warningSent100,
      subItems: q.subItems.map((item) => ({
        id: item.id,
        quotaId: item.quotaId,
        deviceTypeId: item.deviceTypeId,
        subHours: item.subHours,
        deviceTypeName: item.device_types.name,
      })),
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      projectName: q.projects.name,
    }))

    return success(formattedQuotas)
  } catch (err) {
    console.error('获取配额列表失败:', err)
    return error('FETCH_ERROR', '获取配额列表失败', undefined, 500)
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    const userId = request.cookies.get('user-id')?.value
    if (!userId) return error('UNAUTHORIZED', '未授权访问', undefined, 401)
    return error('FORBIDDEN', '只有管理员可以创建配额', undefined, 403)
  }

  try {
    const body = await request.json()
    const data = createQuotaSchema.parse(body)

    const existingQuota = await prisma.quotas.findUnique({
      where: { projectId: data.projectId },
    })

    if (existingQuota) {
      return error('VALIDATION_ERROR', '该项目已存在配额配置', undefined, 400)
    }

    if (data.subItems && data.subItems.length > 0) {
      const validation = validateSubQuotas(data.totalHours, data.subItems)
      if (!validation.valid) {
        return error('VALIDATION_ERROR', validation.error, undefined, 400)
      }
    }

    const quota = await prisma.quotas.create({
      data: {
        id: crypto.randomUUID(),
        projectId: data.projectId,
        totalHours: data.totalHours,
        period: data.period,
      },
    })

    if (data.subItems && data.subItems.length > 0) {
      await prisma.quota_sub_items.createMany({
        data: data.subItems.map((item) => ({
          id: crypto.randomUUID(),
          quotaId: quota.id,
          deviceTypeId: item.deviceTypeId,
          subHours: item.subHours,
        })),
      })
    }

    const result = await prisma.quotas.findUnique({
      where: { id: quota.id },
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

    const formattedQuota = result
      ? {
          id: result.id,
          projectId: result.projectId,
          totalHours: result.totalHours,
          period: result.period,
          warningSent50: result.warningSent50,
          warningSent80: result.warningSent80,
          warningSent100: result.warningSent100,
          subItems: result.subItems.map((item) => ({
            id: item.id,
            quotaId: item.quotaId,
            deviceTypeId: item.deviceTypeId,
            subHours: item.subHours,
            deviceTypeName: item.device_types.name,
          })),
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
          projectName: result.projects.name,
        }
      : null

    return success(formattedQuota, '配额创建成功', 201)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', err.issues[0].message, undefined, 400)
    }
    console.error('创建配额失败:', err)
    return error('CREATE_ERROR', '创建配额失败', undefined, 500)
  }
}
