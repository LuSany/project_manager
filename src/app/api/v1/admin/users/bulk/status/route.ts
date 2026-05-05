import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const { userId } = await getAuthUser(request)
  if (!userId) return null

  const user = await prisma.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// 批量更新状态验证Schema
const bulkUpdateStatusSchema = z.object({
  userIds: z.array(z.string()).min(1, '至少需要选择一个用户').max(100, '最多一次更新100个用户'),
  status: z.enum(['ACTIVE', 'DISABLED', 'PENDING']),
})

// PATCH /api/v1/admin/users/bulk/status - 批量更新用户状态
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const body = await request.json()
    const validatedData = bulkUpdateStatusSchema.parse(body)

    const { userIds, status } = validatedData

    // 批量更新状态
    const result = await prisma.users.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    })

    return success({
      updatedCount: result.count,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '数据验证失败', err.issues as any, 400)
    }
    console.error('批量更新用户状态失败:', err)
    return error('BULK_UPDATE_STATUS_ERROR', '批量更新用户状态失败', undefined, 500)
  }
}
