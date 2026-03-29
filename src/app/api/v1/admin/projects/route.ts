import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'
import { randomUUID } from 'crypto'

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.users.findUnique({ where: { id: userId } })
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

// GET /api/v1/admin/projects - 获取项目列表
export async function GET(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const projects = await db.projects.findMany({
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

    return success(projects)
  } catch (err) {
    console.error('获取项目列表失败:', err)
    return error('GET_PROJECTS_ERROR', '获取项目列表失败', undefined, 500)
  }
}

// POST /api/v1/admin/projects - 创建项目
export async function POST(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // 如果没有指定ownerId，默认为当前管理员
    const ownerId = validatedData.ownerId || admin.id

    // 验证owner是否存在
    const owner = await db.users.findUnique({
      where: { id: ownerId },
    })

    if (!owner) {
      return error('OWNER_NOT_FOUND', '项目负责人不存在', undefined, 400)
    }

    const project = await db.projects.create({
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

    return success(project, '项目创建成功')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '数据验证失败', err.issues as any, 400)
    }
    console.error('创建项目失败:', err)
    return error('CREATE_PROJECT_ERROR', '创建项目失败', undefined, 500)
  }
}
