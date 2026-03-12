import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiResponder } from '@/lib/api/response'

// 添加成员验证Schema
const addMemberSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
  role: z.enum(['MODERATOR', 'REVIEWER', 'OBSERVER', 'SECRETARY']).default('REVIEWER'),
})

// POST /api/v1/review-groups/[id]/members - 添加成员
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: groupId } = await params
    const body = await req.json()
    const validatedData = addMemberSchema.parse(body)

    // 检查评审组是否存在
    const group = await prisma.reviewGroup.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return ApiResponder.notFound('评审组不存在')
    }

    // 检查用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!targetUser) {
      return ApiResponder.notFound('用户不存在')
    }

    // 检查是否已是成员
    const existingMember = await prisma.reviewGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: validatedData.userId,
        },
      },
    })

    if (existingMember) {
      return ApiResponder.error('ALREADY_MEMBER', '该用户已是评审组成员')
    }

    // 添加成员
    const member = await prisma.reviewGroupMember.create({
      data: {
        groupId,
        userId: validatedData.userId,
        role: validatedData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            position: true,
          },
        },
      },
    })

    return ApiResponder.created(member, '成员添加成功')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError('数据验证失败', error.issues as any)
    }
    console.error('添加评审组成员失败:', error)
    return ApiResponder.serverError('添加成员失败')
  }
}

// DELETE /api/v1/review-groups/[id]/members/[userId] - 移除成员
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const { id: groupId, userId } = await params

    // 检查成员是否存在
    const member = await prisma.reviewGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    })

    if (!member) {
      return ApiResponder.notFound('成员不存在')
    }

    // 删除成员
    await prisma.reviewGroupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    })

    return ApiResponder.success(null, '成员移除成功')
  } catch (error) {
    console.error('移除评审组成员失败:', error)
    return ApiResponder.serverError('移除成员失败')
  }
}