import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

const createDeviceTypeSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  modelName: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
})

// GET /api/v1/device-types - List device types
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const name = searchParams.get('name')

    const skip = (page - 1) * pageSize

    const where: any = {}
    if (name) {
      where.name = { contains: name, mode: 'insensitive' }
    }

    const [items, total] = await Promise.all([
      prisma.device_types.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          devices: { select: { id: true, name: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.device_types.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('获取设备类型列表失败:', error)
    return NextResponse.json({ success: false, error: '获取设备类型列表失败' }, { status: 500 })
  }
}

// POST /api/v1/device-types - Create device type
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  // 只有管理员可以创建设备类型
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '此操作需要管理员权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validatedData = createDeviceTypeSchema.parse(body)

    // Check for duplicate name
    const existing = await prisma.device_types.findUnique({
      where: { name: validatedData.name },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: '设备类型名称已存在' }, { status: 400 })
    }

    const deviceType = await prisma.device_types.create({
      data: {
        id: crypto.randomUUID(),
        ...validatedData,
      },
    })

    return NextResponse.json({ success: true, data: deviceType })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('创建设备类型失败:', error)
    return NextResponse.json({ success: false, error: '创建设备类型失败' }, { status: 500 })
  }
}
