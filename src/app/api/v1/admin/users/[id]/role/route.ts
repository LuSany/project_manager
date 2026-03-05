import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE']),
})

// 辅助函数：检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// PUT /api/v1/admin/users/[id]/role - 更新用户角色
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
    const validatedData = updateRoleSchema.parse(body)

    // 防止管理员降级自己
    if (id === admin.id && validatedData.role !== 'ADMIN') {
      return error('FORBIDDEN', '不能修改自己的管理员角色', undefined, 400)
    }

    const user = await db.user.update({
      where: { id },
      data: { role: validatedData.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'ROLE_CHANGE',
        entityType: 'User',
        entityId: id,
        description: `将用户 ${user.name} 角色更改为 ${validatedData.role}`,
      },
    })

    return NextResponse.json(success(user))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', err.issues[0].message, undefined, 400)
    }
    console.error('更新用户角色失败:', err)
    return error('UPDATE_ROLE_ERROR', '更新用户角色失败', undefined, 500)
  }
}