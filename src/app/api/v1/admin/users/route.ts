import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// GET /api/v1/admin/users - 获取用户列表
export async function GET(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        position: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(success(users))
  } catch (err) {
    console.error('获取用户列表失败:', err)
    return error('GET_USERS_ERROR', '获取用户列表失败', undefined, 500)
  }
}