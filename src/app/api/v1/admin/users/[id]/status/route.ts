import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'DISABLED']),
})

// 辅助函数：检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// PUT /api/v1/admin/users/[id]/status - 更新用户状态
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    const user = await db.user.update({
      where: { id },
      data: { status: validatedData.status },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    })

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        description: `将用户 ${user.name} 状态更改为 ${validatedData.status}`,
      },
    })

    return NextResponse.json(success(user))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', err.issues[0].message, undefined, 400)
    }
    console.error('更新用户状态失败:', err)
    return error('UPDATE_STATUS_ERROR', '更新用户状态失败', undefined, 500)
  }
}