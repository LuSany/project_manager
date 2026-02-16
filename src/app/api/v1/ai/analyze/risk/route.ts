import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/auth'
import { analyzeRisk } from '@/lib/ai'

const riskAnalysisSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return ApiResponder.unauthorized('请先登录')
    }

    const body = await req.json()
    const validatedData = riskAnalysisSchema.parse(body)

    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        owner: true,
        members: {
          include: { user: true },
        },
      },
    })

    if (!project) {
      return ApiResponder.notFound('项目不存在')
    }

    const isOwner = project.ownerId === user.id
    const isMember = project.members.some((m) => m.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isMember && !isAdmin) {
      return ApiResponder.forbidden('无权分析此项目风险')
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: validatedData.projectId },
      select: { title: true, status: true, progress: true },
    })

    const milestones = await prisma.milestone.findMany({
      where: { projectId: validatedData.projectId },
      select: { title: true, dueDate: true, status: true },
    })

    const taskData = tasks.map((t) => ({
      name: t.title,
      status: t.status,
      progress: t.progress || 0,
    }))

    const milestoneData = milestones.map((m) => ({
      name: m.title,
      dueDate: m.dueDate?.toISOString() || '',
      status: m.status,
    }))

    const result = await analyzeRisk(
      project.name,
      project.description || '',
      taskData,
      milestoneData,
      user.id,
      validatedData.projectId
    )

    if (!result.success) {
      return ApiResponder.serverError(result.error || '风险分析失败')
    }

    return ApiResponder.success({
      projectId: validatedData.projectId,
      analysis: result.result,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message
          return acc
        },
        {} as Record<string, string>
      )
      return ApiResponder.validationError('数据验证失败', issues)
    }
    console.error('风险分析失败:', error)
    return ApiResponder.serverError('风险分析失败')
  }
}
