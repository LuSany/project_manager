import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
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

// 更新项目验证Schema
const updateProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

// PUT /api/v1/admin/projects/[id] - 管理员更新项目
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    // 检查管理员权限
    const admin = await checkAdmin(req)
    if (!admin) {
      const { userId } = await getAuthUser(req)
      if (!userId) {
        return ApiResponder.unauthorized('请先登录')
      }
      return ApiResponder.forbidden('只有管理员可以更新项目')
    }

    // 检查项目是否存在
    const project = await prisma.projects.findUnique({
      where: { id },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    // 验证请求体
    const body = await req.json()
    const validatedData = updateProjectSchema.parse(body)

    // 如果指定了ownerId，验证用户是否存在
    if (validatedData.ownerId) {
      const owner = await prisma.users.findUnique({
        where: { id: validatedData.ownerId },
      })

      if (!owner) {
        return ApiResponder.error('OWNER_NOT_FOUND', '项目负责人不存在', undefined, 400)
      }
    }

    // 更新项目
    const updateData: any = { ...validatedData, updatedAt: new Date() }

    // 转换日期字符串为Date对象
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate)
    }

    const updatedProject = await prisma.projects.update({
      where: { id },
      data: updateData,
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

    return ApiResponder.success(updatedProject, '项目更新成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.error('VALIDATION_ERROR', '数据验证失败', error.issues as any, 400)
    }
    console.error('管理员更新项目错误:', error)
    return ApiResponder.serverError('更新项目失败')
  }
}

// DELETE /api/v1/admin/projects/[id] - 管理员删除项目
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    // 检查管理员权限
    const admin = await checkAdmin(req)
    if (!admin) {
      const { userId } = await getAuthUser(req)
      if (!userId) {
        return ApiResponder.unauthorized('请先登录')
      }
      return ApiResponder.forbidden('只有管理员可以删除项目')
    }

    // 检查项目是否存在
    const project = await prisma.projects.findUnique({
      where: { id },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    // 删除项目（Prisma 会级联删除相关数据）
    await prisma.projects.delete({
      where: { id },
    })

    return ApiResponder.success({ id }, '项目已删除')
  } catch (error) {
    console.error('管理员删除项目错误:', error)
    return ApiResponder.serverError('删除项目失败')
  }
}
