import { prisma } from '@/lib/prisma'

export interface AIRequest {
  model?: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
}

export interface AIResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface RiskAnalysisResult {
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  analysis: string
  factors: string[]
  recommendations: string[]
}

export interface ReviewAuditResult {
  isCompliant: boolean
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
    description: string
    suggestion: string
  }>
  overallAssessment: string
  score: number
}

async function getDefaultAIConfig() {
  return await prisma.aIConfig.findFirst({
    where: {
      isActive: true,
      isDefault: true,
    },
  })
}

function mapRiskScoreToLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score <= 30) return 'LOW'
  if (score <= 60) return 'MEDIUM'
  if (score <= 85) return 'HIGH'
  return 'CRITICAL'
}

export async function callAI(
  prompt: string,
  serviceType: 'RISK_ANALYSIS' | 'REVIEW_AUDIT' | 'DOC_PARSE',
  userId?: string,
  projectId?: string
): Promise<{ success: boolean; response?: string; error?: string; logId?: string }> {
  const startTime = Date.now()
  const apiKey = process.env.AI_API_KEY
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  const logId = ''

  const config = await getDefaultAIConfig()
  const effectiveModel = config?.model || model
  const effectiveBaseUrl = config?.baseUrl || baseUrl
  const effectiveApiKey = config?.apiKey || apiKey

  try {
    if (!effectiveApiKey) {
      const log = await prisma.aILog.create({
        data: {
          serviceType,
          provider: config?.provider || 'OPENAI',
          model: effectiveModel,
          prompt,
          status: 'FAILED',
          errorMessage: 'AI_API_KEY is not configured',
          duration: Date.now() - startTime,
          userId: userId || null,
          projectId: projectId || null,
        },
      })
      return { success: false, error: 'AI_API_KEY is not configured', logId: log.id }
    }

    const request: AIRequest = {
      model: effectiveModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }

    const response = await fetch(`${effectiveBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveApiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const log = await prisma.aILog.create({
        data: {
          serviceType,
          provider: config?.provider || 'OPENAI',
          model: effectiveModel,
          prompt,
          status: 'FAILED',
          errorMessage: `AI API error: ${response.status} - ${errorText}`,
          duration: Date.now() - startTime,
          userId: userId || null,
          projectId: projectId || null,
        },
      })
      return { success: false, error: errorText, logId: log.id }
    }

    const data: AIResponse = await response.json()
    const content = data.choices[0]?.message?.content || ''

    const log = await prisma.aILog.create({
      data: {
        serviceType,
        provider: config?.provider || 'OPENAI',
        model: effectiveModel,
        prompt,
        response: content,
        status: 'SUCCESS',
        duration: Date.now() - startTime,
        userId: userId || null,
        projectId: projectId || null,
        externalId: data.id,
      },
    })

    return { success: true, response: content, logId: log.id }
  } catch (error) {
    const log = await prisma.aILog.create({
      data: {
        serviceType,
        provider: config?.provider || 'OPENAI',
        model: model,
        prompt,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        userId: userId || null,
        projectId: projectId || null,
      },
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logId: log.id,
    }
  }
}

export async function analyzeRisk(
  projectName: string,
  projectDescription: string,
  tasks: Array<{ name: string; status: string; progress: number }>,
  milestones: Array<{ name: string; dueDate: string; status: string }>,
  userId?: string,
  projectId?: string
): Promise<{ success: boolean; result?: RiskAnalysisResult; error?: string }> {
  const prompt = `你是一个专业的项目风险管理专家。请分析以下项目的风险状况：

项目名称：${projectName}
项目描述：${projectDescription}

任务列表：
${tasks.map((t, i) => `${i + 1}. ${t.name} - 状态: ${t.status} - 进度: ${t.progress}%`).join('\n')}

里程碑：
${milestones.map((m, i) => `${i + 1}. ${m.name} - 截止日期: ${m.dueDate} - 状态: ${m.status}`).join('\n')}

请以JSON格式返回风险分析结果，格式如下：
{
  "riskScore": 0-100的风险分数,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "analysis": "风险分析说明",
  "factors": ["风险因素1", "风险因素2", ...],
  "recommendations": ["建议1", "建议2", ...]
}`

  const result = await callAI(prompt, 'RISK_ANALYSIS', userId, projectId)

  if (!result.success || !result.response) {
    return { success: false, error: result.error }
  }

  try {
    const parsed = JSON.parse(result.response)
    return {
      success: true,
      result: {
        riskScore: parsed.riskScore || 0,
        riskLevel: mapRiskScoreToLevel(parsed.riskScore || 0),
        analysis: parsed.analysis || '',
        factors: parsed.factors || [],
        recommendations: parsed.recommendations || [],
      },
    }
  } catch {
    return { success: false, error: 'Failed to parse AI response' }
  }
}

export async function auditReview(
  reviewTitle: string,
  reviewType: string,
  materials: Array<{ name: string; type: string; content: string }>,
  userId?: string,
  projectId?: string
): Promise<{ success: boolean; result?: ReviewAuditResult; error?: string }> {
  const prompt = `你是一个专业的评审审核专家。请审核以下评审材料：

评审标题：${reviewTitle}
评审类型：${reviewType}

评审材料：
${materials
  .map((m, i) => `${i + 1}. ${m.name} (${m.type}):\n${m.content.substring(0, 500)}`)
  .join('\n\n')}

请以JSON格式返回审核结果，格式如下：
{
  "isCompliant": true或false,
  "issues": [
    {
      "severity": "low" | "medium" | "high" | "critical",
      "category": "问题类别",
      "description": "问题描述",
      "suggestion": "改进建议"
    }
  ],
  "overallAssessment": "总体评价",
  "score": 0-100的评分
}`

  const result = await callAI(prompt, 'REVIEW_AUDIT', userId, projectId)

  if (!result.success || !result.response) {
    return { success: false, error: result.error }
  }

  try {
    const parsed = JSON.parse(result.response)
    return {
      success: true,
      result: {
        isCompliant: parsed.isCompliant ?? true,
        issues: parsed.issues || [],
        overallAssessment: parsed.overallAssessment || '',
        score: parsed.score || 0,
      },
    }
  } catch {
    return { success: false, error: 'Failed to parse AI response' }
  }
}
