import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

// 用户更新 Schema
const updateUserSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(50).optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
})

// GET /api/v1/users/me - 获取当前用户信息
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: '未授权，请先登录' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
      department: user.department,
      position: user.position,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
  })
}

// PUT /api/v1/users/me - 更新用户信息
export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: '未授权，请先登录' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: validatedData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        department: updatedUser.department,
        position: updatedUser.position,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error('更新用户信息失败:', error)
    return NextResponse.json(
      { success: false, error: '更新用户信息失败' },
      { status: 500 }
    )
  }
}