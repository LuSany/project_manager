import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 操作类型定义
 */
export type Action = 'create' | 'read' | 'update' | 'delete' | 'list'

/**
 * 资源类型定义
 */
export type ResourceType = 'project' | 'task' | 'requirement' | 'risk' | 'review'

/**
 * 获取认证用户
 */
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return prisma.users.findUnique({ where: { id: userId } })
}

/**
 * 要求管理员权限 - 用于 API 路由中的权限守卫
 *
 * @param request - NextRequest
 * @returns 用户对象或错误响应
 */
export async function requireAdmin(request: NextRequest): Promise<{
  user: Awaited<ReturnType<typeof getAuthUser>>
  error?: NextResponse
}> {
  const user = await getAuthUser(request)

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: '未授权，请先登录' },
        { status: 401 }
      ),
    }
  }

  if (user.role !== 'ADMIN') {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: '此操作需要管理员权限' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * 检查用户是否为某设备类型的审批人
 *
 * @param userId - 用户ID
 * @param deviceTypeId - 设备类型ID
 * @returns 是否有审批权限
 */
export async function isApprover(userId: string, deviceTypeId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  // ADMIN 默认有审批权限
  if (user?.role === 'ADMIN') return true

  const config = await prisma.approval_configs.findUnique({
    where: { deviceTypeId },
    select: { approverIds: true },
  })

  if (!config) return false

  const approverIds = JSON.parse(config.approverIds) as string[][]
  const allApproverIds = approverIds.flat()
  return allApproverIds.includes(userId)
}

/**
 * 要求审批人权限 - 用于审批操作 API 的权限守卫
 *
 * @param request - NextRequest
 * @param deviceTypeId - 设备类型ID
 * @returns 用户对象或错误响应
 */
export async function requireApprover(
  request: NextRequest,
  deviceTypeId: string
): Promise<{
  user: Awaited<ReturnType<typeof getAuthUser>>
  error?: NextResponse
}> {
  const user = await getAuthUser(request)

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: '未授权，请先登录' },
        { status: 401 }
      ),
    }
  }

  // ADMIN 有审批权限
  if (user.role === 'ADMIN') {
    return { user }
  }

  const config = await prisma.approval_configs.findUnique({
    where: { deviceTypeId },
    select: { approverIds: true },
  })

  if (!config) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: '该设备类型未配置审批流程' },
        { status: 403 }
      ),
    }
  }

  const approverIds = JSON.parse(config.approverIds) as string[][]
  const allApproverIds = approverIds.flat()

  if (!allApproverIds.includes(user.id)) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: '您不是该设备类型的审批人' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * 检查用户权限 - 混合 RBAC + 基于资源的权限控制
 *
 * RBAC 层规则：
 * - ADMIN → 所有操作允许
 * - PROJECT_ADMIN → 可创建/编辑/删除项目、任务
 * - EMPLOYEE → 只能查看和编辑自己的任务
 *
 * Resource 层规则（如果提供 resourceId）：
 * - PROJECT_OWNER → 项目资源的完全访问权限
 * - PROJECT_MEMBER → 查看+编辑访问权限
 * - 非成员 → 拒绝（除非是 ADMIN 角色）
 *
 * 自动继承规则：
 * - 如果用户是项目成员，自动具有项目内任务的 'view' 权限
 *
 * @param userId - 用户ID
 * @param action - 操作类型（create, read, update, delete, list）
 * @param resourceType - 资源类型（project, task, requirement, risk, review）
 * @param resourceId - 资源ID（可选）
 * @returns 是否有权限
 */
export async function checkPermission(
  userId: string,
  action: Action,
  resourceType: ResourceType,
  resourceId?: string
): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) {
    return false
  }

  if (user.role === 'ADMIN') {
    return true
  }

  if (user.role === 'PROJECT_ADMIN') {
    if (resourceType === 'project' || resourceType === 'task') {
      return ['create', 'read', 'update', 'delete', 'list'].includes(action)
    }
    return ['read', 'list'].includes(action)
  }

  if (user.role === 'EMPLOYEE') {
    if (action === 'read' || action === 'list') {
      return true
    }
    if (action === 'update' && resourceType === 'task' && resourceId) {
      const task = await prisma.tasks.findUnique({
        where: { id: resourceId },
        select: { projectId: true },
      })
      if (!task) return false

      const member = await prisma.project_members.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId,
          },
        },
      })

      if (member && ['PROJECT_OWNER', 'PROJECT_ADMIN', 'PROJECT_MEMBER'].includes(member.role)) {
        return true
      }

      const assignee = await prisma.task_assignees.findUnique({
        where: {
          taskId_userId: {
            taskId: resourceId,
            userId,
          },
        },
      })

      return !!assignee
    }
    return false
  }

  if (resourceId) {
    let projectId: string | null = null

    if (resourceType === 'project') {
      projectId = resourceId
    } else if (resourceType === 'task') {
      const task = await prisma.tasks.findUnique({
        where: { id: resourceId },
        select: { projectId: true },
      })
      projectId = task?.projectId || null
    } else if (resourceType === 'requirement') {
      const requirement = await prisma.requirements.findUnique({
        where: { id: resourceId },
        select: { projectId: true },
      })
      projectId = requirement?.projectId || null
    } else if (resourceType === 'risk') {
      const risk = await prisma.risks.findUnique({
        where: { id: resourceId },
        select: { projectId: true },
      })
      projectId = risk?.projectId || null
    } else if (resourceType === 'review') {
      const review = await prisma.reviews.findUnique({
        where: { id: resourceId },
        select: { projectId: true },
      })
      projectId = review?.projectId || null
    }

    if (!projectId) {
      return false
    }

    const member = await prisma.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    if (!member) {
      return false
    }

    if (member.role === 'PROJECT_OWNER') {
      return true
    }

    if (member.role === 'PROJECT_ADMIN' || member.role === 'PROJECT_MEMBER') {
      return ['read', 'list', 'update'].includes(action)
    }
  }

  return false
}

/**
 * 获取资源的权限列表
 *
 * @param resourceType - 资源类型
 * @param resourceId - 资源ID
 * @returns 权限列表（包含用户信息、角色和是否继承）
 */
export async function getResourcePermissions(
  resourceType: ResourceType,
  resourceId: string
): Promise<
  Array<{ userId: string; userName: string; userEmail: string; role: string; inherited: boolean }>
> {
  let projectId: string | null = null

  if (resourceType === 'project') {
    projectId = resourceId
  } else if (resourceType === 'task') {
    const task = await prisma.tasks.findUnique({
      where: { id: resourceId },
      select: { projectId: true },
    })
    projectId = task?.projectId || null
  } else if (resourceType === 'requirement') {
    const requirement = await prisma.requirements.findUnique({
      where: { id: resourceId },
      select: { projectId: true },
    })
    projectId = requirement?.projectId || null
  } else if (resourceType === 'risk') {
    const risk = await prisma.risks.findUnique({
      where: { id: resourceId },
      select: { projectId: true },
    })
    projectId = risk?.projectId || null
  } else if (resourceType === 'review') {
    const review = await prisma.reviews.findUnique({
      where: { id: resourceId },
      select: { projectId: true },
    })
    projectId = review?.projectId || null
  }

  if (!projectId) {
    return []
  }

  const members = await prisma.project_members.findMany({
    where: { projectId },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return members.map((member) => ({
    userId: member.userId,
    userName: member.users.name,
    userEmail: member.users.email,
    role: member.role,
    inherited: resourceType !== 'project',
  }))
}

/**
 * 获取用户的所有权限
 *
 * @param userId - 用户ID
 * @returns 权限列表（包含资源类型、资源ID、资源名称和权限）
 */
export async function getUserPermissions(userId: string): Promise<
  Array<{
    resourceType: ResourceType
    resourceId: string
    resourceName: string
    permission: string
  }>
> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) {
    return []
  }

  if (user.role === 'ADMIN') {
    const projects = await prisma.projects.findMany({
      select: {
        id: true,
        name: true,
      },
    })

    return projects.map((project) => ({
      resourceType: 'project' as ResourceType,
      resourceId: project.id,
      resourceName: project.name,
      permission: 'all',
    }))
  }

  const memberships = await prisma.project_members.findMany({
    where: { userId },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const permissions: Array<{
    resourceType: ResourceType
    resourceId: string
    resourceName: string
    permission: string
  }> = []

  for (const membership of memberships) {
    const permissionLevel = membership.role === 'PROJECT_OWNER' ? 'all' : 'read,update'

    permissions.push({
      resourceType: 'project',
      resourceId: membership.projects.id,
      resourceName: membership.projects.name,
      permission: permissionLevel,
    })

    if (
      membership.role === 'PROJECT_OWNER' ||
      membership.role === 'PROJECT_ADMIN' ||
      membership.role === 'PROJECT_MEMBER'
    ) {
      permissions.push({
        resourceType: 'task',
        resourceId: membership.projects.id,
        resourceName: `${membership.projects.name} - 任务`,
        permission: 'read',
      })
    }
  }

  return permissions
}
