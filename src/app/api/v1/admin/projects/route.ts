import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { getAuthUser } from '@/lib/auth/get-auth-user'

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const { userId } = await getAuthUser(request)
  if (!userId) return null

  const user = await prisma.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// 创建项目验证Schema
const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

// GET /api/v1/admin/projects - 获取项目列表（含成员和任务计数）
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      const { userId } = await getAuthUser(req)
      if (!userId) {
        return ApiResponder.unauthorized('请先登录')
      }
      return ApiResponder.forbidden('只有管理员可以访问项目列表')
    }

    const projects = await prisma.projects.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            project_members: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return ApiResponder.success(projects)
  } catch (error) {
    console.error('获取项目列表失败:', error)
    return ApiResponder.serverError('获取项目列表失败')
  }
}

// POST /api/v1/admin/projects - 创建项目
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      const { userId } = await getAuthUser(req)
      if (!userId) {
        return ApiResponder.unauthorized('请先登录')
      }
      return ApiResponder.forbidden('只有管理员可以创建项目')
    }

    const body = await req.json()
    const validatedData = createProjectSchema.parse(body)

    // 如果没有指定ownerId，默认为当前管理员
    const ownerId = validatedData.ownerId || admin.id

    // 验证owner是否存在
    const owner = await prisma.users.findUnique({
      where: { id: ownerId },
    })

    if (!owner) {
      return ApiResponder.error('OWNER_NOT_FOUND', '项目负责人不存在', undefined, 400)
    }

    const project = await prisma.projects.create({
      data: {
        id: randomUUID(),
        name: validatedData.name,
        description: validatedData.description,
        status: 'PLANNING',
        ownerId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            project_members: true,
            tasks: true,
          },
        },
      },
    })

    return ApiResponder.success(project, '项目创建成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.error('VALIDATION_ERROR', '数据验证失败', error.issues as any, 400)
    }
    console.error('创建项目失败:', error)
    return ApiResponder.serverError('创建项目失败')
  }
}
