import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'
import bcrypt from 'bcrypt'

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// 创建用户验证Schema
const createUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6个字符'),
  role: z.enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE']),
  department: z.string().optional(),
  position: z.string().optional(),
})

// GET /api/v1/admin/users - 获取用户列表
export async function GET(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const role = searchParams.get('role') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (role) {
      where.role = role
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        position: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(success(users))
  } catch (err) {
    console.error('获取用户列表失败:', err)
    return error('GET_USERS_ERROR', '获取用户列表失败', undefined, 500)
  }
}

// POST /api/v1/admin/users - 创建新用户
export async function POST(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // 检查邮箱是否已存在
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return error('EMAIL_EXISTS', '该邮箱已被注册', undefined, 400)
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        department: validatedData.department,
        position: validatedData.position,
        status: 'ACTIVE',
      },
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
    })

    return NextResponse.json(success(user))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '数据验证失败', err.issues as any, 400)
    }
    console.error('创建用户失败:', err)
    return error('CREATE_USER_ERROR', '创建用户失败', undefined, 500)
  }
}