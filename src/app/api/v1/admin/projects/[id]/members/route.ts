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

const addMemberSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  role: z.enum(['PROJECT_OWNER', 'PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_DIRECTOR']),
})

// POST /api/v1/admin/projects/[id]/members - 添加成员
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params

  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      const { userId } = await getAuthUser(req)
      if (!userId) {
        return ApiResponder.unauthorized('请先登录')
      }
      return ApiResponder.forbidden('只有管理员可以管理项目成员')
    }

    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    const body = await req.json()
    const validatedData = addMemberSchema.parse(body)

    const user = await prisma.users.findUnique({
      where: { id: validatedData.userId },
    })

    if (!user) {
      return ApiResponder.notFound('用户不存在')
    }

    const existingMember = await prisma.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: validatedData.userId,
        },
      },
    })

    if (existingMember) {
      return ApiResponder.error('ALREADY_MEMBER', '该用户已经是项目成员', undefined, 400)
    }

    const member = await prisma.project_members.create({
      data: {
        projectId,
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
      },
    })

    return ApiResponder.success(member, '成员添加成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.error('VALIDATION_ERROR', '数据验证失败', error.issues as any, 400)
    }
    console.error('添加成员失败:', error)
    return ApiResponder.serverError('添加成员失败')
  }
}

// DELETE /api/v1/admin/projects/[id]/members - 移除成员
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params

  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      const { userId } = await getAuthUser(req)
      if (!userId) {
        return ApiResponder.unauthorized('请先登录')
      }
      return ApiResponder.forbidden('只有管理员可以管理项目成员')
    }

    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return ApiResponder.error('MISSING_USER_ID', '缺少用户ID参数', undefined, 400)
    }

    await prisma.project_members.deleteMany({
      where: {
        projectId,
        userId,
      },
    })

    return ApiResponder.success(null, '成员移除成功')
  } catch (error) {
    console.error('移除成员失败:', error)
    return ApiResponder.serverError('移除成员失败')
  }
}
