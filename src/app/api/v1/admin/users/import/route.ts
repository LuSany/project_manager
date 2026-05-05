import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const { userId } = await getAuthUser(request)
  if (!userId) return null

  const user = await prisma.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// 导入用户验证Schema
const importUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  role: z
    .enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE'])
    .optional(),
  department: z.string().optional(),
})

const importSchema = z.object({
  users: z.array(importUserSchema).min(1, '至少需要导入一个用户').max(100, '最多一次导入100个用户'),
})

// 生成随机密码
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// POST /api/v1/admin/users/import - 批量导入用户
import { getAuthUser } from '@/lib/auth/get-auth-user'
export async function POST(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const body = await request.json()
    const validatedData = importSchema.parse(body)

    const { users } = validatedData

    // 提取所有邮箱
    const emails = users.map((u) => u.email)

    // 检查重复邮箱
    const duplicateUsers = await prisma.users.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
      },
    })

    const duplicateEmails = new Set(duplicateUsers.map((u) => u.email))

    // 过滤掉重复的用户
    const usersToImport = users.filter((u) => !duplicateEmails.has(u.email))

    if (usersToImport.length === 0) {
      return success({
        imported: 0,
        skipped: users.length,
        errors: [],
      })
    }

    // 为每个用户生成密码并加密
    const userData = await Promise.all(
      usersToImport.map(async (user) => {
        const password = generatePassword()
        const passwordHash = await bcrypt.hash(password, 10)

        return {
          id: randomUUID(),
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role || 'EMPLOYEE',
          department: user.department,
          status: 'ACTIVE' as const,
          updatedAt: new Date(),
        }
      })
    )

    // 批量创建用户（跳过重复）
    const result = await prisma.users.createMany({
      data: userData,
      skipDuplicates: true,
    })

    // 收集错误信息
    const errors: Array<{ row: number; email: string; error: string }> = []
    users.forEach((user, index) => {
      if (duplicateEmails.has(user.email)) {
        errors.push({
          row: index + 1,
          email: user.email,
          error: '邮箱已存在',
        })
      }
    })

    return success({
      imported: result.count,
      skipped: users.length - result.count,
      errors,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '数据验证失败', err.issues as any, 400)
    }
    console.error('导入用户失败:', err)
    return error('IMPORT_USERS_ERROR', '导入用户失败', undefined, 500)
  }
}
