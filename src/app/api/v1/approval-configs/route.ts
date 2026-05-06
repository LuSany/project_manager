import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { success, error, unauthorized, notFound, validationError, forbidden } from '@/lib/api/response'
import { getAuthUser } from '@/lib/auth-helpers'

const createApprovalConfigSchema = z.object({
  deviceTypeId: z.string().uuid('无效的设备类型ID'),
  levels: z.number().int().min(1).max(10).default(1),
  approverIds: z.string().refine(
    (val) => {
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) && parsed.every((level) => Array.isArray(level))
      } catch {
        return false
      }
    },
    { message: 'approverIds 必须是 JSON 格式的二维数组，如 [["uid1","uid2"],["uid3"]]' }
  ),
})

// GET /api/v1/approval-configs - List approval configs
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return unauthorized('未授权，请先登录')
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const deviceTypeId = searchParams.get('deviceTypeId')

    const skip = (page - 1) * pageSize

    const where: any = {}
    if (deviceTypeId) {
      where.deviceTypeId = deviceTypeId
    }

    const [items, total] = await Promise.all([
      prisma.approval_configs.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          device_types: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.approval_configs.count({ where }),
    ])

    // Parse approverIds JSON for each item
    const itemsWithParsedApprovers = items.map((item) => ({
      ...item,
      approverIds: JSON.parse(item.approverIds) as string[][],
    }))

    return success({
      items: itemsWithParsedApprovers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('获取审批配置列表失败:', err)
    return error('FETCH_FAILED', '获取审批配置列表失败')
  }
}

// POST /api/v1/approval-configs - Create approval config
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return unauthorized('未授权，请先登录')
  }

  // 只有管理员可以创建审批配置
  if (user.role !== 'ADMIN') {
    return forbidden('此操作需要管理员权限')
  }

  try {
    const body = await request.json()
    const validatedData = createApprovalConfigSchema.parse(body)

    // Check if device type exists
    const deviceType = await prisma.device_types.findUnique({
      where: { id: validatedData.deviceTypeId },
    })
    if (!deviceType) {
      return notFound('设备类型不存在')
    }

    // Check if approval config already exists for this device type
    const existing = await prisma.approval_configs.findUnique({
      where: { deviceTypeId: validatedData.deviceTypeId },
    })
    if (existing) {
      return validationError('该设备类型已配置审批流程，如需修改请使用 PUT 方法')
    }

    // Validate all approver IDs exist
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

    const approvalConfig = await prisma.approval_configs.create({
      data: {
        id: crypto.randomUUID(),
        deviceTypeId: validatedData.deviceTypeId,
        levels: validatedData.levels,
        approverIds: validatedData.approverIds,
      },
      include: {
        device_types: { select: { id: true, name: true } },
      },
    })

    return success(
      { ...approvalConfig, approverIds: JSON.parse(approvalConfig.approverIds) as string[][] },
      '审批配置创建成功',
      201
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return validationError(err.issues[0].message)
    }
    console.error('创建审批配置失败:', err)
    return error('CREATE_FAILED', '创建审批配置失败')
  }
}
