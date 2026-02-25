/**
 * AI 评审服务
 * 
 * 提供评审相关的 AI 辅助功能：
 * - 材料分析：分析评审材料的完整性和质量
 * - 检查项生成：根据评审类型自动生成检查项
 * - 风险识别：识别评审过程中的潜在风险
 * - 摘要生成：生成评审摘要报告
 */

import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { callAI } from '@/lib/ai'

// ============================================================================
// 类型定义
// ============================================================================

export interface MaterialAnalysisResult {
  completenessScore: number
  analysis: string
  missingItems: string[]
  suggestions: string[]
}

export interface GeneratedCriteria {
  id?: string
  title: string
  description?: string
  category?: string
  isRequired: boolean
  weight: number
  maxScore: number
}

export interface IdentifiedRisk {
  title: string
  description?: string
  category: 'TECHNICAL' | 'SCHEDULE' | 'RESOURCE' | 'BUDGET' | 'EXTERNAL' | 'MANAGEMENT'
  probability: number
  impact: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  mitigation?: string
  recommendation?: string
}

export interface ReviewSummary {
  short: string
  standard: string
  detailed: string
  keyPoints: string[]
  conclusion: string
}

// ============================================================================
// AI 提示词模板
// ============================================================================

const PROMPTS = {
  MATERIAL_ANALYSIS: (reviewType: string, materials: Array<{ name: string; type: string; size: number }>) => `
你是一个专业的评审材料分析专家。请分析以下评审材料的完整性和质量：

评审类型：${reviewType}

材料列表：
${materials.map(m => `- ${m.name} (${m.type}, ${m.size} bytes)`).join('\n')}

请分析：
1. 材料完整性（是否缺少必要的材料）
2. 材料质量（文件格式、大小是否合理）
3. 材料之间的关联性和一致性

请以 JSON 格式返回分析结果：
{
  "completenessScore": 0-100 的完整性分数,
  "analysis": "详细分析说明",
  "missingItems": ["缺失项 1", "缺失项 2"],
  "suggestions": ["改进建议 1", "改进建议 2"]
}
`,

  CRITERIA_GENERATION: (reviewType: string, materials: Array<{ name: string; type: string }>) => `
你是一个经验丰富的评审专家。请根据以下评审信息生成检查项列表：

评审类型：${reviewType}

参考材料：
${materials.map(m => `- ${m.name} (${m.type})`).join('\n')}

请生成 5-10 个关键检查项，覆盖评审的主要方面。

请以 JSON 数组格式返回，每个检查项包含：
[
  {
    "title": "检查项标题",
    "description": "检查项详细描述",
    "category": "检查项类别",
    "isRequired": true/false,
    "weight": 权重 (1.0-5.0),
    "maxScore": 满分 (通常 10)
  }
]
`,

  RISK_IDENTIFICATION: (reviewType: string, materials: Array<{ name: string; type: string }>) => `
你是一个专业的风险评估专家。请识别以下评审可能存在的风险：

评审类型：${reviewType}

参考材料：
${materials.map(m => `- ${m.name} (${m.type})`).join('\n')}

请从技术、进度、资源、预算、外部、管理等维度识别潜在风险。

请以 JSON 数组格式返回识别出的风险：
[
  {
    "title": "风险标题",
    "description": "风险详细描述",
    "category": "TECHNICAL|SCHEDULE|RESOURCE|BUDGET|EXTERNAL|MANAGEMENT",
    "probability": 发生概率 1-5,
    "impact": 影响程度 1-5,
    "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
    "mitigation": "缓解措施",
    "recommendation": "建议行动"
  }
]
`,

  SUMMARY_GENERATION: (reviewTitle: string, reviewType: string, analysisResult: string, criteriaResults: string, risks: string) => `
你是一个专业的评审报告撰写专家。请根据以下评审信息生成摘要报告：

评审标题：${reviewTitle}
评审类型：${reviewType}

材料分析结果：
${analysisResult}

检查项评审结果：
${criteriaResults}

识别的风险：
${risks}

请生成三种长度的摘要：
1. 简短摘要：100 字以内，用于快速预览
2. 标准摘要：500 字左右，用于常规报告
3. 详细摘要：1000 字左右，用于完整文档

同时提取 3-5 个关键点和结论建议。

请以 JSON 格式返回：
{
  "short": "简短摘要",
  "standard": "标准摘要",
  "detailed": "详细摘要",
  "keyPoints": ["关键点 1", "关键点 2"],
  "conclusion": "结论建议"
}
`
}

// ============================================================================
// 工具函数
// ============================================================================

function mapRiskLevel(probability: number, impact: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const score = probability * impact
  if (score <= 4) return 'LOW'
  if (score <= 9) return 'MEDIUM'
  if (score <= 16) return 'HIGH'
  return 'CRITICAL'
}

function createCacheKey(reviewId: string, analysisType: string): string {
  return `ai-review:${reviewId}:${analysisType}`
}

// ============================================================================
// 核心服务函数
// ============================================================================

/**
 * AI 材料分析
 */
export async function analyzeMaterials(
  reviewId: string,
  userId?: string
): Promise<{ success: boolean; result?: MaterialAnalysisResult; error?: string }> {
  try {
    const cacheKey = createCacheKey(reviewId, 'MATERIAL_ANALYSIS')
    const cachedResult = cache.get<MaterialAnalysisResult>(cacheKey)
    if (cachedResult) {
      return { success: true, result: cachedResult }
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        materials: true,
        type: true,
      },
    })

    if (!review) {
      return { success: false, error: '评审不存在' }
    }

    const materials = review.materials.map(m => ({
      name: m.fileName,
      type: m.fileType,
      size: m.fileSize,
    }))

    if (materials.length === 0) {
      return { success: false, error: '没有评审材料' }
    }

    const prompt = PROMPTS.MATERIAL_ANALYSIS(review.type.name, materials)
    const aiResult = await callAI(prompt, 'REVIEW_AUDIT', userId, review.projectId)
    
    if (!aiResult.success || !aiResult.response) {
      return { success: false, error: aiResult.error }
    }

    try {
      const parsed: MaterialAnalysisResult = JSON.parse(aiResult.response)
      cache.set(cacheKey, parsed, 5 * 60 * 1000, ['ai-review', reviewId])
      
      await prisma.reviewAiAnalysis.create({
        data: {
          reviewId,
          analysisType: 'MATERIAL_ANALYSIS',
          result: JSON.stringify(parsed),
          duration: 0,
        },
      })

      return { success: true, result: parsed }
    } catch {
      return { success: false, error: 'AI 响应解析失败' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '分析失败',
    }
  }
}

/**
 * AI 生成检查项
 */
export async function generateCriteria(
  reviewId: string,
  userId?: string
): Promise<{ success: boolean; result?: GeneratedCriteria[]; error?: string }> {
  try {
    const cacheKey = createCacheKey(reviewId, 'CRITERIA_GENERATION')
    const cachedResult = cache.get<GeneratedCriteria[]>(cacheKey)
    if (cachedResult) {
      return { success: true, result: cachedResult }
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        materials: true,
        type: true,
      },
    })

    if (!review) {
      return { success: false, error: '评审不存在' }
    }

    const materials = review.materials.map(m => ({
      name: m.fileName,
      type: m.fileType,
    }))

    const prompt = PROMPTS.CRITERIA_GENERATION(review.type.name, materials)
    const aiResult = await callAI(prompt, 'REVIEW_AUDIT', userId, review.projectId)
    
    if (!aiResult.success || !aiResult.response) {
      return { success: false, error: aiResult.error }
    }

    try {
      const parsed: GeneratedCriteria[] = JSON.parse(aiResult.response)
      cache.set(cacheKey, parsed, 10 * 60 * 1000, ['ai-review', reviewId])
      return { success: true, result: parsed }
    } catch {
      return { success: false, error: 'AI 响应解析失败' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败',
    }
  }
}

/**
 * AI 风险识别
 */
export async function identifyRisks(
  reviewId: string,
  userId?: string
): Promise<{ success: boolean; result?: IdentifiedRisk[]; error?: string }> {
  try {
    const cacheKey = createCacheKey(reviewId, 'RISK_IDENTIFICATION')
    const cachedResult = cache.get<IdentifiedRisk[]>(cacheKey)
    if (cachedResult) {
      return { success: true, result: cachedResult }
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        materials: true,
        type: true,
      },
    })

    if (!review) {
      return { success: false, error: '评审不存在' }
    }

    const materials = review.materials.map(m => ({
      name: m.fileName,
      type: m.fileType,
    }))

    const prompt = PROMPTS.RISK_IDENTIFICATION(review.type.name, materials)
    const aiResult = await callAI(prompt, 'RISK_ANALYSIS', userId, review.projectId)
    
    if (!aiResult.success || !aiResult.response) {
      return { success: false, error: aiResult.error }
    }

    try {
      const parsed: IdentifiedRisk[] = JSON.parse(aiResult.response)
      const normalizedRisks = parsed.map(risk => ({
        ...risk,
        riskLevel: mapRiskLevel(risk.probability, risk.impact),
      }))
      cache.set(cacheKey, normalizedRisks, 10 * 60 * 1000, ['ai-review', reviewId])
      return { success: true, result: normalizedRisks }
    } catch {
      return { success: false, error: 'AI 响应解析失败' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '识别失败',
    }
  }
}

/**
 * AI 生成摘要
 */
export async function generateSummary(
  reviewId: string,
  userId?: string
): Promise<{ success: boolean; result?: ReviewSummary; error?: string }> {
  try {
    const cacheKey = createCacheKey(reviewId, 'SUMMARY_GENERATION')
    const cachedResult = cache.get<ReviewSummary>(cacheKey)
    if (cachedResult) {
      return { success: true, result: cachedResult }
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        type: true,
      },
    })

    if (!review) {
      return { success: false, error: '评审不存在' }
    }

    const [materialAnalysis, criteriaResults, risks] = await Promise.all([
      prisma.reviewAiAnalysis.findFirst({
        where: { reviewId, analysisType: 'MATERIAL_ANALYSIS' },
      }),
      prisma.reviewItem.findMany({
        where: { reviewId },
        orderBy: { order: 'asc' },
      }),
      prisma.reviewAiAnalysis.findFirst({
        where: { reviewId, analysisType: 'RISK_IDENTIFICATION' },
      }),
    ])

    const analysisText = materialAnalysis?.result || '无材料分析结果'
    const criteriaText = criteriaResults
      .map((c, i) => `${i + 1}. ${c.title} - ${c.description || ''}`)
      .join('\n')
    const risksText = risks?.result || '无风险识别结果'

    const prompt = PROMPTS.SUMMARY_GENERATION(
      review.title,
      review.type.name,
      analysisText,
      criteriaText,
      risksText
    )

    const aiResult = await callAI(prompt, 'REVIEW_AUDIT', userId, review.projectId)

    if (!aiResult.success || !aiResult.response) {
      return { success: false, error: aiResult.error }
    }

    try {
      const parsed: ReviewSummary = JSON.parse(aiResult.response)
      cache.set(cacheKey, parsed, 15 * 60 * 1000, ['ai-review', reviewId])
      
      await prisma.reviewAiAnalysis.create({
        data: {
          reviewId,
          analysisType: 'SUMMARY',
          result: JSON.stringify(parsed),
          duration: 0,
        },
      })

      return { success: true, result: parsed }
    } catch {
      return { success: false, error: 'AI 响应解析失败' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败',
    }
  }
}

export const aiReviewService = {
  analyzeMaterials,
  generateCriteria,
  identifyRisks,
  generateSummary,
}
