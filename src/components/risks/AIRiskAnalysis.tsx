'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Brain } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { RiskSuggestionCard } from './RiskSuggestionCard'
import type { RiskLevel, RiskCategory } from '@/types/risk'
import { calculateRiskLevel } from '@/types/risk'

interface RiskAnalysisResult {
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  analysis: string
  factors: string[]
  recommendations: string[]
}

interface AnalysisResponse {
  projectId: string
  analysis: RiskAnalysisResult
  analyzedAt: string
}

interface RiskSuggestion {
  title: string
  category: RiskCategory
  probability: number
  impact: number
  riskLevel: RiskLevel
  mitigation: string
  recommendation: string
}

interface AIRiskAnalysisProps {
  projectId: string
  onRiskCreated?: () => void
}

const CATEGORY_MAP: Record<string, RiskCategory> = {
  技术: 'TECHNICAL',
  资源: 'RESOURCE',
  进度: 'SCHEDULE',
  预算: 'BUDGET',
  外部: 'EXTERNAL',
  管理: 'MANAGEMENT',
}

function parseCategory(factor: string): RiskCategory {
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (factor.includes(key)) {
      return value
    }
  }
  return 'TECHNICAL'
}

function parseProbability(factor: string): number {
  if (factor.includes('高') || factor.includes('严重')) return 4
  if (factor.includes('中等') || factor.includes('一般')) return 3
  if (factor.includes('低') || factor.includes('较小')) return 2
  return 3
}

function parseImpact(factor: string): number {
  if (factor.includes('重大') || factor.includes('严重')) return 4
  if (factor.includes('中等') || factor.includes('一般')) return 3
  if (factor.includes('轻微') || factor.includes('较小')) return 2
  return 3
}

export function AIRiskAnalysis({ projectId, onRiskCreated }: AIRiskAnalysisProps) {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [suggestions, setSuggestions] = useState<RiskSuggestion[]>([])
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSuggestions([])

    try {
      const response = await api.post<AnalysisResponse>('/ai/analyze/risk', { projectId })

      if (!response.success) {
        toast({
          title: '分析失败',
          description: response.error?.message || '请稍后重试',
          variant: 'destructive',
        })
        return
      }

      setAnalysisResult(response.data as AnalysisResponse)

      const result = (response.data as AnalysisResponse).analysis
      const newSuggestions: RiskSuggestion[] = result.factors.map((factor, index) => {
        const recommendation = result.recommendations[index] || ''
        const probability = parseProbability(factor)
        const impact = parseImpact(factor)
        const riskLevel = calculateRiskLevel(probability, impact)

        return {
          title: factor.substring(0, 50) + (factor.length > 50 ? '...' : ''),
          category: parseCategory(factor),
          probability,
          impact,
          riskLevel,
          mitigation: recommendation.substring(0, 100),
          recommendation,
        }
      })

      setSuggestions(newSuggestions)

      if (newSuggestions.length === 0) {
        toast({
          title: '分析完成',
          description: '未发现明显风险因素',
          variant: 'success',
        })
      }
    } catch (error) {
      toast({
        title: '分析失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreateRisk = async (index: number) => {
    const suggestion = suggestions[index]
    if (!suggestion) return

    setCreatingIndex(index)

    try {
      const response = await api.post('/risks', {
        projectId,
        title: suggestion.title,
        category: suggestion.category,
        probability: suggestion.probability,
        impact: suggestion.impact,
        mitigation: suggestion.mitigation,
        isAiIdentified: true,
      })

      if (!response.success) {
        toast({
          title: '创建失败',
          description: response.error?.message || '请稍后重试',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: '创建成功',
        description: '风险已添加到列表',
        variant: 'success',
      })

      setSuggestions((prev) => prev.filter((_, i) => i !== index))
      onRiskCreated?.()
    } catch (error) {
      toast({
        title: '创建失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setCreatingIndex(null)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAnalyze} disabled={isAnalyzing} variant="outline">
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            分析中...
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            AI 分析
          </>
        )}
      </Button>

      {analysisResult && suggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">AI 风险建议</h2>
          <p className="text-muted-foreground text-sm">
            共发现 {suggestions.length} 个潜在风险因素，点击"创建为风险"将建议转为正式风险记录
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {suggestions.map((suggestion, index) => (
              <RiskSuggestionCard
                key={index}
                suggestion={suggestion}
                onCreateRisk={() => handleCreateRisk(index)}
                isCreating={creatingIndex === index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
