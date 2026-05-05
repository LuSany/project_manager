import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { success,
  error,
  unauthorized,
  notFound,
  validationError,
  forbidden, } from '@/lib/api/response'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

const updateApprovalConfigSchema = z.object({
  levels: z.number().int().min(1).max(10).optional(),
  approverIds: z
    .string()
    .refine(
      (val) => {
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) && parsed.every((level) => Array.isArray(level))
        } catch {
          return false
        }
      },
      { message: 'approverIds 必须是 JSON 格式的二维数组' }
    )
    .optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request)
  if (!user) {
    return unauthorized('未授权，请先登录')
  }

  try {
    const { id } = await params

    const approvalConfig = await prisma.approval_configs.findUnique({
      where: { id },
      include: {
        device_types: { select: { id: true, name: true } },
      },
    })

    if (!approvalConfig) {
      return notFound('审批配置不存在')
    }

    return success({
      ...approvalConfig,
      approverIds: JSON.parse(approvalConfig.approverIds) as string[][],
    })
  } catch (err) {
    console.error('获取审批配置详情失败:', err)
    return error('FETCH_FAILED', '获取审批配置详情失败')
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request)
  if (!user) {
    return unauthorized('未授权，请先登录')
  }

  // 只有管理员可以更新审批配置
  if (user.role !== 'ADMIN') {
    return forbidden('此操作需要管理员权限')
  }

  try {
    const { id } = await params

    const existing = await prisma.approval_configs.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFound('审批配置不存在')
    }

    const body = await request.json()
    const validatedData = updateApprovalConfigSchema.parse(body)

    if (validatedData.approverIds) {
      const approverIdsArray = JSON.parse(validatedData.approverIds) as string[][]
      const allApproverIds = approverIdsArray.flat()

      const validApprovers = await prisma.users.findMany({
        where: { id: { in: allApproverIds } },
        select: { id: true },
      })

      if (validApprovers.length !== allApproverIds.length) {
        const invalidIds = allApproverIds.filter((id) => !validApprovers.some((a) => a.id === id))
        return validationError(`审批人不存在: ${invalidIds.join(', ')}`)
      }
    }

    const updateData: any = {}
    if (validatedData.levels !== undefined) {
      updateData.levels = validatedData.levels
    }
    if (validatedData.approverIds !== undefined) {
      updateData.approverIds = validatedData.approverIds
    }

    const approvalConfig = await prisma.approval_configs.update({
      where: { id },
      data: updateData,
      include: {
        device_types: { select: { id: true, name: true } },
      },
    })

    return success(
      {
        ...approvalConfig,
        approverIds: JSON.parse(approvalConfig.approverIds) as string[][],
      },
      '审批配置更新成功'
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return validationError(err.issues[0].message)
    }
    console.error('更新审批配置失败:', err)
    return error('UPDATE_FAILED', '更新审批配置失败')
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request)
  if (!user) {
    return unauthorized('未授权，请先登录')
  }

  try {
    const { id } = await params

    const existing = await prisma.approval_configs.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFound('审批配置不存在')
    }

    await prisma.approval_configs.delete({
      where: { id },
    })

    return success(null, '审批配置删除成功')
  } catch (err) {
    console.error('删除审批配置失败:', err)
    return error('DELETE_FAILED', '删除审批配置失败')
  }
}
