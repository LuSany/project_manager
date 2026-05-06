import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth-helpers'
import { ApiResponder } from '@/lib/api/response'
import { MAX_PAGE_SIZE } from '@/lib/constants'

const createDeviceSchema = z.object({
  name: z.string().min(1, '设备名称不能为空'),
  typeId: z.string().min(1, '设备类型不能为空'),
})

// GET /api/v1/devices - List devices
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), MAX_PAGE_SIZE)
    const status = searchParams.get('status')
    const typeId = searchParams.get('typeId')
    const name = searchParams.get('name')

    const skip = (page - 1) * pageSize

    const where: any = {}
    if (status) where.status = status
    if (typeId) where.typeId = typeId
    if (name) where.name = { contains: name, mode: 'insensitive' }

    const [items, total] = await Promise.all([
      prisma.devices.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          device_types: {
            select: { id: true, name: true, modelName: true, location: true, owner: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.devices.count({ where }),
    ])

    return ApiResponder.paginated(items, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('获取设备列表失败:', error)
    return ApiResponder.serverError('获取设备列表失败')
  }
}

// POST /api/v1/devices - Create device
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return ApiResponder.unauthorized('未授权，请先登录')
  }

  // 只有管理员可以创建设备
  if (user.role !== 'ADMIN') {
    return ApiResponder.forbidden('此操作需要管理员权限')
  }

  try {
    const body = await request.json()
    const validatedData = createDeviceSchema.parse(body)

    // Verify device type exists
    const deviceType = await prisma.device_types.findUnique({
      where: { id: validatedData.typeId },
    })
    if (!deviceType) {
      return ApiResponder.validationError('设备类型不存在')
    }

    const device = await prisma.devices.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name,
        typeId: validatedData.typeId,
        status: 'AVAILABLE',
      },
      include: {
        device_types: { select: { id: true, name: true, modelName: true } },
      },
    })

    return ApiResponder.created(device)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('数据验证失败', { issues: error.issues })
    }
    console.error('创建设备失败:', error)
    return ApiResponder.serverError('创建设备失败')
  }
}
