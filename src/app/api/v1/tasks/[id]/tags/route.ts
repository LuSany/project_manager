import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}

const addTagSchema = z
  .object({
    name: z.string().min(1, '标签名称不能为空').optional(),
    tagId: z.string().min(1, '标签ID不能为空').optional(),
  })
  .refine((data) => data.name || data.tagId, {
    message: '必须提供标签名称或标签ID',
  })

const TAG_COLORS = [
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
]

function getRandomColor() {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { name, tagId } = addTagSchema.parse(body)

    const task = await db.tasks.findUnique({
      where: { id: taskId },
      include: {
        task_assignees: { select: { userId: true } },
        projects: { select: { ownerId: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    const isAssignee = task.task_assignees.some((a) => a.userId === user.id)
    const isProjectOwner = task.projects?.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    const projectMember = await db.project_members.findUnique({
      where: {
        projectId_userId: { projectId: task.projectId, userId: user.id },
      },
    })

    if (!isAssignee && !isProjectOwner && !projectMember && !isAdmin) {
      return NextResponse.json({ success: false, error: '无权访问此任务' }, { status: 403 })
    }

    let tag
    if (name) {
      tag = await db.tags.findFirst({ where: { name } })
      if (!tag) {
        tag = await db.tags.create({
          data: { id: crypto.randomUUID(), name, color: getRandomColor(), updatedAt: new Date() },
        })
      }
    } else if (tagId) {
      tag = await db.tags.findUnique({ where: { id: tagId } })
      if (!tag) {
        return NextResponse.json({ success: false, error: '标签不存在' }, { status: 404 })
      }
    } else {
      return NextResponse.json(
        { success: false, error: '必须提供标签名称或标签ID' },
        { status: 400 }
      )
    }

    const existingRelation = await db.task_tags.findUnique({
      where: { taskId_tagId: { taskId, tagId: tag.id } },
    })

    if (existingRelation) {
      return NextResponse.json({ success: false, error: '任务已关联该标签' }, { status: 400 })
    }

    await db.task_tags.create({
      data: { taskId, tagId: tag.id },
    })

    return NextResponse.json({ success: true, data: tag })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    console.error('为任务添加标签失败:', error)
    return NextResponse.json({ success: false, error: '为任务添加标签失败' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 })
  }

  try {
    const { id: taskId } = await params

    const task = await db.tasks.findUnique({
      where: { id: taskId },
      include: {
        task_assignees: { select: { userId: true } },
        projects: { select: { ownerId: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 })
    }

    const isAssignee = task.task_assignees.some((a) => a.userId === user.id)
    const isProjectOwner = task.projects?.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    const projectMember = await db.project_members.findUnique({
      where: {
        projectId_userId: { projectId: task.projectId, userId: user.id },
      },
    })

    if (!isAssignee && !isProjectOwner && !projectMember && !isAdmin) {
      return NextResponse.json({ success: false, error: '无权访问此任务' }, { status: 403 })
    }

    const task_tags = await db.task_tags.findMany({
      where: { taskId },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: task_tags.map((tt) => tt.tags),
    })
  } catch (error) {
    console.error('获取任务标签失败:', error)
    return NextResponse.json({ success: false, error: '获取任务标签失败' }, { status: 500 })
  }
}
