import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponder } from '@/lib/api/response'
import { analyzeRisk } from '@/lib/ai'
import { notifyAIRiskScanResult } from '@/lib/notification'

const scanRequestSchema = z.object({
  projectIds: z.array(z.string().min(1)).min(1).max(50),
})

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const internalToken = req.headers.get('x-internal-token')

  const validApiKey = process.env.INTERNAL_API_KEY
  const validToken = process.env.INTERNAL_TOKEN

  const isAuthorized =
    (validApiKey && apiKey === validApiKey) || (validToken && internalToken === validToken)

  if (!isAuthorized) {
    return ApiResponder.unauthorized('需要系统授权才能执行扫描')
  }

  try {
    const body = await req.json()
    const validatedData = scanRequestSchema.parse(body)

    const results: Array<{
      projectId: string
      projectName: string
      riskCount: number
      highRiskCount: number
    }> = []

    for (const projectId of validatedData.projectIds) {
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        include: {
          users: true,
        },
      })

      if (!project) {
        continue
      }

      const tasks = await prisma.tasks.findMany({
        where: { projectId },
        select: { title: true, status: true, progress: true },
      })

      const milestones = await prisma.milestones.findMany({
        where: { projectId },
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

      const analysisResult = await analyzeRisk(
        project.name,
        project.description || '',
        taskData,
        milestoneData,
        undefined,
        projectId
      )

      if (analysisResult.success && analysisResult.result) {
        const cacheKey = `ai-risk-scan:${projectId}:${new Date().toISOString().split('T')[0]}`

        await prisma.ai_response_cache.create({
          data: {
            id: crypto.randomUUID(),
            cacheKey,
            serviceType: 'RISK_SCAN',
            requestHash: projectId,
            response: JSON.stringify(analysisResult.result),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        })

        const riskCount = analysisResult.result.factors.length
        const highRiskCount =
          analysisResult.result.riskLevel === 'HIGH' ||
          analysisResult.result.riskLevel === 'CRITICAL'
            ? 1
            : 0

        results.push({
          projectId,
          projectName: project.name,
          riskCount,
          highRiskCount,
        })

        await notifyAIRiskScanResult(
          project.ownerId,
          projectId,
          project.name,
          riskCount,
          highRiskCount
        )
      }
    }

    const totalRisks = results.reduce((sum, r) => sum + r.riskCount, 0)

    return ApiResponder.success({
      success: true,
      scannedProjects: results.length,
      totalRisks,
      results,
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
    console.error('风险扫描失败:', error)
    return ApiResponder.serverError('风险扫描失败')
  }
}
