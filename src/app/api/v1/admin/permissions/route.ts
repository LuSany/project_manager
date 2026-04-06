import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'

async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

const addPermissionSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  projectId: z.string().min(1, '项目ID不能为空'),
  role: z.enum(['PROJECT_OWNER', 'PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_DIRECTOR']),
})

export async function GET(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    // 获取所有项目
    const projects = await db.projects.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 获取所有权限配置
    const permissions = await db.project_members.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    // 返回项目和权限配置
    return success({ projects, permissions })
  } catch (err) {
    console.error('获取权限列表失败:', err)
    return error('GET_PERMISSIONS_ERROR', '获取权限列表失败', undefined, 500)
  }
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const body = await request.json()
    const validatedData = addPermissionSchema.parse(body)

    const user = await db.users.findUnique({
      where: { id: validatedData.userId },
    })

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    const project = await db.projects.findUnique({
      where: { id: validatedData.projectId },
    })

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404)
    }

    const permission = await db.project_members.upsert({
      where: {
        projectId_userId: {
          projectId: validatedData.projectId,
          userId: validatedData.userId,
        },
      },
      update: {
        role: validatedData.role,
        joinedAt: new Date(),
      },
      create: {
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        role: validatedData.role,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return success(permission, '权限设置成功')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '数据验证失败', err.issues as any, 400)
    }
    console.error('设置权限失败:', err)
    return error('SET_PERMISSION_ERROR', '设置权限失败', undefined, 500)
  }
}
