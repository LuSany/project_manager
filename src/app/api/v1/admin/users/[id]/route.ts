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

// 更新用户验证Schema
const updateUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  password: z.string().min(6, '密码至少6个字符').optional(),
  role: z.enum(['ADMIN', 'PROJECT_ADMIN', 'PROJECT_OWNER', 'PROJECT_MEMBER', 'EMPLOYEE']).optional(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'ACTIVE', 'DISABLED']).optional(),
})

// GET /api/v1/admin/users/[id] - 获取单个用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
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
        _count: {
          select: {
            projectMembers: true,
            taskAssignees: true,
            ownedProjects: true,
          },
        },
      },
    })

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    return success(user)
  } catch (err) {
    console.error('获取用户详情失败:', err)
    return error('GET_USER_ERROR', '获取用户详情失败', undefined, 500)
  }
}

// PUT /api/v1/admin/users/[id] - 更新用户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // 检查用户是否存在
    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    // 如果更新邮箱，检查是否已被其他用户使用
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailUser = await db.user.findUnique({
        where: { email: validatedData.email },
      })
      if (emailUser) {
        return error('EMAIL_EXISTS', '该邮箱已被其他用户使用', undefined, 400)
      }
    }

    // 构建更新数据
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.role !== undefined) updateData.role = validatedData.role
    if (validatedData.department !== undefined) updateData.department = validatedData.department
    if (validatedData.position !== undefined) updateData.position = validatedData.position
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    // 如果更新密码
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 10)
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
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
        updatedAt: true,
      },
    })

    return success(user)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '数据验证失败', err.issues as any, 400)
    }
    console.error('更新用户失败:', err)
    return error('UPDATE_USER_ERROR', '更新用户失败', undefined, 500)
  }
}

// DELETE /api/v1/admin/users/[id] - 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(request)
  if (!admin) {
    return error('FORBIDDEN', '无权限访问', undefined, 403)
  }

  try {
    const { id } = await params

    // 不能删除自己
    if (id === admin.id) {
      return error('CANNOT_DELETE_SELF', '不能删除自己的账号', undefined, 400)
    }

    // 检查用户是否存在
    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    // 删除用户（级联删除相关数据）
    await db.$transaction(async (tx) => {
      // 删除用户的项目成员关系
      await tx.projectMember.deleteMany({
        where: { userId: id },
      })

      // 删除用户的任务分配关系
      await tx.taskAssignee.deleteMany({
        where: { userId: id },
      })

      // 删除用户的任务观察者关系
      await tx.taskWatcher.deleteMany({
        where: { userId: id },
      })

      // 删除用户的通知
      await tx.notification.deleteMany({
        where: { userId: id },
      })

      // 删除用户的通知偏好
      await tx.notificationPreference.deleteMany({
        where: { userId: id },
      })

      // 删除用户的通知忽略设置
      await tx.notificationIgnore.deleteMany({
        where: { userId: id },
      })

      // 将用户拥有的项目转移给管理员
      await tx.project.updateMany({
        where: { ownerId: id },
        data: { ownerId: admin.id },
      })

      // 删除用户
      await tx.user.delete({
        where: { id },
      })
    })

    return success({ message: '用户已删除' })
  } catch (err) {
    console.error('删除用户失败:', err)
    return error('DELETE_USER_ERROR', '删除用户失败', undefined, 500)
  }
}