import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

/**
 * 获取已认证用户
 * @param request - Next.js 请求对象
 * @returns 用户对象或 null（如果未认证）
 */
export async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

/**
 * 获取用户有权限访问的项目 ID 列表
 * @param userId - 用户 ID
 * @returns 项目 ID 数组
 */
export async function getUserProjectIds(userId: string) {
  const userProjects = await prisma.projects.findMany({
    where: {
      OR: [{ ownerId: userId }, { project_members: { some: { userId: userId } } }],
    },
    select: { id: true },
  })
  return userProjects.map((p) => p.id)
}