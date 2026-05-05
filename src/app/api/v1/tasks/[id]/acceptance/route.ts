import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponder } from '@/lib/api/response'
import { z } from 'zod'
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request)
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

const updateAcceptanceSchema = z.object({
  result: z.enum(['PASSED', 'FAILED']),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params
  const user = await getAuthUser(request)

  if (!user) {
    return ApiResponder.unauthorized('未授权')
  }

  try {
    // 验证任务存在和访问权限
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      include: {
        projects: {
          select: {
            ownerId: true,
            project_members: { where: { userId: user.id } },
          },
        },
      },
    })

    if (!task) return ApiResponder.notFound('任务不存在')

    const isProjectOwner = task.projects.ownerId === user.id
    const isProjectMember = task.projects.project_members.length > 0
    const isAdmin = user.role === 'ADMIN'

    if (!isProjectOwner && !isProjectMember && !isAdmin) {
      return ApiResponder.forbidden('无权访问')
    }

    // 获取验收记录
    const acceptances = await db.task_acceptances.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        users_task_acceptances_acceptorIdTousers: {
          select: { id: true, name: true, avatar: true },
        },
        users_task_acceptances_requesterIdTousers: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return ApiResponder.success(acceptances)
  } catch (error) {
    console.error('获取验收记录失败:', error)
    return ApiResponder.serverError('获取验收记录失败')
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params
  const user = await getAuthUser(request)

  if (!user) return ApiResponder.unauthorized('未授权')

  try {
    const body = await request.json()
    const { acceptorId } = body

    if (!acceptorId) {
      return ApiResponder.error('INVALID_REQUEST', '请选择验收人', undefined, 400)
    }

    // 验证任务状态
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      include: { projects: { select: { ownerId: true, project_members: true } } },
    })

    if (!task) return ApiResponder.notFound('任务不存在')

    // 只允许进度 100% 且状态非 REVIEW/DONE/CANCELLED 的任务发起验收
    if (task.progress < 100) {
      return ApiResponder.validationError('任务进度必须达到 100% 才能发起验收')
    }

    if (['REVIEW', 'DONE', 'CANCELLED'].includes(task.status)) {
      return ApiResponder.validationError('任务当前状态不允许发起验收')
    }

    // 权限检查：任务负责人或项目经理可发起
    const isProjectOwner = task.projects.ownerId === user.id
    const isAssignee = await db.task_assignees.findFirst({
      where: { taskId, userId: user.id },
    })
    const isAdmin = user.role === 'ADMIN'

    if (!isProjectOwner && !isAssignee && !isAdmin) {
      return ApiResponder.forbidden('无权发起验收')
    }

    // 创建验收记录并更新任务状态
    const acceptance = await db.task_acceptances.create({
      data: {
        id: crypto.randomUUID(),
        taskId,
        acceptorId,
        requesterId: user.id,
        result: 'PENDING',
      },
      include: {
        users_task_acceptances_acceptorIdTousers: {
          select: { id: true, name: true, avatar: true },
        },
        users_task_acceptances_requesterIdTousers: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    // 更新任务状态为 REVIEW
    await db.tasks.update({
      where: { id: taskId },
      data: { status: 'REVIEW', updatedAt: new Date() },
    })

    return ApiResponder.created(acceptance, '验收请求已发起')
  } catch (error) {
    console.error('发起验收失败:', error)
    return ApiResponder.serverError('发起验收失败')
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params
  const user = await getAuthUser(request)

  if (!user) return ApiResponder.unauthorized('未授权')

  try {
    const body = await request.json()
    const validated = updateAcceptanceSchema.safeParse(body)

    if (!validated.success) {
      return ApiResponder.validationError('无效的验收结果')
    }

    const { result, notes } = validated.data

    // 查找待处理的验收记录
    const pendingAcceptance = await db.task_acceptances.findFirst({
      where: { taskId, result: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })

    if (!pendingAcceptance) {
      return ApiResponder.notFound('无待处理的验收记录')
    }

    // 权限检查：仅验收人可操作
    if (pendingAcceptance.acceptorId !== user.id) {
      const task = await db.tasks.findUnique({
        where: { id: taskId },
        include: { projects: { select: { ownerId: true } } },
      })
      const isProjectOwner = task?.projects.ownerId === user.id
      const isAdmin = user.role === 'ADMIN'

      if (!isProjectOwner && !isAdmin) {
        return ApiResponder.forbidden('无权进行验收')
      }
    }

    // 更新验收记录
    const updated = await db.task_acceptances.update({
      where: { id: pendingAcceptance.id },
      data: { result, notes, updatedAt: new Date() },
      include: {
        users_task_acceptances_acceptorIdTousers: {
          select: { id: true, name: true, avatar: true },
        },
        users_task_acceptances_requesterIdTousers: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    // 更新任务状态
    const newStatus = result === 'PASSED' ? 'DONE' : 'IN_PROGRESS'
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    }

    if (result === 'PASSED') {
      updateData.completedAt = new Date()
    }

    await db.tasks.update({
      where: { id: taskId },
      data: updateData,
    })

    return ApiResponder.success(
      updated,
      result === 'PASSED' ? '验收通过' : '验收不通过，任务已退回'
    )
  } catch (error) {
    console.error('处理验收失败:', error)
    return ApiResponder.serverError('处理验收失败')
  }
}
