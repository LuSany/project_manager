import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/get-auth-user'

async function checkAdmin(request: NextRequest) {
  const { userId } = await getAuthUser(request)
  if (!userId) return null

  const user = await prisma.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params

  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const project = await prisma.projects.findUnique({
      where: { id: resourceId },
    })

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404)
    }

    const members = await prisma.project_members.findMany({
      where: { projectId: resourceId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return success(members)
  } catch (err) {
    console.error('获取资源权限失败:', err)
    return error('GET_RESOURCE_PERMISSIONS_ERROR', '获取资源权限失败', undefined, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params

  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return error('MISSING_USER_ID', '缺少用户ID', undefined, 400)
    }

    const project = await prisma.projects.findUnique({
      where: { id: resourceId },
    })

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404)
    }

    await prisma.project_members.deleteMany({
      where: {
        projectId: resourceId,
        userId,
      },
    })

    return success(null, '权限移除成功')
  } catch (err) {
    console.error('移除权限失败:', err)
    return error('REMOVE_PERMISSION_ERROR', '移除权限失败', undefined, 500)
  }
}
