import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { success, error } from '@/lib/api/response'
import { z } from 'zod'

// 辅助函数：获取认证用户并检查管理员权限
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null

  const user = await db.users.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return null

  return user
}

// 添加成员验证Schema
const addMemberSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  role: z.enum(['PROJECT_OWNER', 'PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_DIRECTOR']),
})

// POST /api/v1/admin/projects/[id]/members - 添加成员
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params

  try {
    // 检查管理员权限
    const admin = await checkAdmin(req)
    if (!admin) {
      return error('FORBIDDEN', '无权限访问', undefined, 403)
    }

    // 检查项目是否存在
    const project = await db.projects.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404)
    }

    // 验证请求体
    const body = await req.json()
    const validatedData = addMemberSchema.parse(body)

    // 验证用户是否存在
    const user = await db.users.findUnique({
      where: { id: validatedData.userId },
    })

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    // 检查用户是否已经是成员
    const existingMember = await db.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: validatedData.userId,
        },
      },
    })

    if (existingMember) {
      return error('ALREADY_MEMBER', '该用户已经是项目成员', undefined, 400)
    }

    // 添加成员
    const member = await db.project_members.create({
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

    return success(member, '成员添加成功')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('VALIDATION_ERROR', '数据验证失败', err.issues as any, 400)
    }
    console.error('添加成员失败:', err)
    return error('ADD_MEMBER_ERROR', '添加成员失败', undefined, 500)
  }
}

// DELETE /api/v1/admin/projects/[id]/members - 移除成员
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params

  try {
    // 检查管理员权限
    const admin = await checkAdmin(req)
    if (!admin) {
      return error('FORBIDDEN', '无权限访问', undefined, 403)
    }

    // 检查项目是否存在
    const project = await db.projects.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404)
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return error('MISSING_USER_ID', '缺少用户ID参数', undefined, 400)
    }

    // 删除成员
    await db.project_members.deleteMany({
      where: {
        projectId,
        userId,
      },
    })

    return success(null, '成员移除成功')
  } catch (err) {
    console.error('移除成员失败:', err)
    return error('REMOVE_MEMBER_ERROR', '移除成员失败', undefined, 500)
  }
}
