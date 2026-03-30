import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
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
      db.device_types.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          devices: { select: { id: true, name: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.device_types.count({ where }),
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

  try {
    const body = await request.json()
    const validatedData = createDeviceTypeSchema.parse(body)

    // Check for duplicate name
    const existing = await db.device_types.findUnique({
      where: { name: validatedData.name },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: '设备类型名称已存在' }, { status: 400 })
    }

    const deviceType = await db.device_types.create({
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
