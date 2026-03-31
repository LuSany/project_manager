'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Home, Loader2, FileCheck, Shield, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisResult {
  completenessScore: number
  analysis: string
  missingItems: string[]
  suggestions: string[]
}

interface Criteria {
  title: string
  description?: string
  category?: string
  isRequired?: boolean
  weight?: number
  maxScore?: number
}

interface Risk {
  title: string
  description?: string
  category: string
  probability: number
  impact: number
  riskLevel: string
}

interface Summary {
  short: string
  standard: string
  detailed: string
  keyPoints: string[]
  conclusion: string
}

const riskLevelColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export default function ReviewAiAnalysisPage() {
  const params = useParams()
  const reviewId = params.id as string

  const [analyzing, setAnalyzing] = useState<{ [key: string]: boolean }>({
    materials: false,
    criteria: false,
    risks: false,
    summary: false,
  })
  const [materialAnalysis, setMaterialAnalysis] = useState<AnalysisResult | null>(null)
  const [criteria, setCriteria] = useState<Criteria[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeMaterials = async () => {
    setAnalyzing((prev) => ({ ...prev, materials: true }))
    setError(null)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-analyze`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setMaterialAnalysis(json.result)
      } else {
        setError(json.error || '分析失败')
      }
    } catch {
      setError('分析失败')
    } finally {
      setAnalyzing((prev) => ({ ...prev, materials: false }))
    }
  }

  const generateCriteria = async () => {
    setAnalyzing((prev) => ({ ...prev, criteria: true }))
    setError(null)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-generate-criteria`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        setCriteria(json.result)
      } else {
        setError(json.error || '生成失败')
      }
    } catch {
      setError('生成失败')
    } finally {
      setAnalyzing((prev) => ({ ...prev, criteria: false }))
    }
  }

  const identifyRisks = async () => {
    setAnalyzing((prev) => ({ ...prev, risks: true }))
    setError(null)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-identify-risks`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setRisks(json.result)
      } else {
        setError(json.error || '识别失败')
      }
    } catch {
      setError('识别失败')
    } finally {
      setAnalyzing((prev) => ({ ...prev, risks: false }))
    }
  }

  const generateSummary = async () => {
    setAnalyzing((prev) => ({ ...prev, summary: true }))
    setError(null)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-generate-summary`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSummary(json.result.fullSummary)
      } else {
        setError(json.error || '生成失败')
      }
    } catch {
      setError('生成失败')
    } finally {
      setAnalyzing((prev) => ({ ...prev, summary: false }))
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      {/* 返回导航 */}
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/reviews/${reviewId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回评审
          </Button>
        </Link>
        <Link href="/reviews">
          <Button variant="ghost" size="sm" className="gap-1">
            返回评审列表
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      </div>

      <h1 className="mb-8 text-3xl font-bold">AI 评审分析</h1>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="flex items-center gap-2 p-4 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 材料分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              1. 材料分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!materialAnalysis && (
              <Button onClick={analyzeMaterials} disabled={analyzing.materials} className="w-full">
                {analyzing.materials ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  '开始分析材料'
                )}
              </Button>
            )}
            {analyzing.materials && !materialAnalysis && (
              <div className="space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
            {materialAnalysis && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">完整性评分</span>
                    <Badge
                      className={cn(
                        materialAnalysis.completenessScore >= 80
                          ? 'bg-green-500'
                          : materialAnalysis.completenessScore >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      )}
                    >
                      {materialAnalysis.completenessScore} 分
                    </Badge>
                  </div>
                  <Progress
                    value={materialAnalysis.completenessScore}
                    max={100}
                    variant={
                      materialAnalysis.completenessScore >= 80
                        ? 'success'
                        : materialAnalysis.completenessScore >= 50
                          ? 'warning'
                          : 'danger'
                    }
                  />
                </div>
                <p className="text-muted-foreground text-sm">{materialAnalysis.analysis}</p>
                {materialAnalysis.missingItems.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">缺失项：</span>
                    <ul className="text-muted-foreground list-inside list-disc text-sm">
                      {materialAnalysis.missingItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 生成检查项 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              2. 生成检查项
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criteria.length === 0 && (
              <Button
                onClick={generateCriteria}
                disabled={analyzing.criteria}
                variant="secondary"
                className="w-full"
              >
                {analyzing.criteria ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  '生成检查项'
                )}
              </Button>
            )}
            {analyzing.criteria && criteria.length === 0 && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
            {criteria.length > 0 && (
              <ul className="max-h-64 space-y-2 overflow-auto">
                {criteria.map((c, i) => (
                  <li key={i} className="border-b pb-2 last:border-0">
                    <span className="font-medium">{c.title}</span>
                    {c.description && (
                      <p className="text-muted-foreground mt-1 text-sm">{c.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 风险识别 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              3. 风险识别
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {risks.length === 0 && (
              <Button
                onClick={identifyRisks}
                disabled={analyzing.risks}
                variant="destructive"
                className="w-full"
              >
                {analyzing.risks ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    识别中...
                  </>
                ) : (
                  '识别风险'
                )}
              </Button>
            )}
            {analyzing.risks && risks.length === 0 && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
            {risks.length > 0 && (
              <ul className="max-h-64 space-y-2 overflow-auto">
                {risks.map((r, i) => (
                  <li key={i} className="border-b pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.title}</span>
                      <Badge className={cn(riskLevelColors[r.riskLevel])}>{r.riskLevel}</Badge>
                    </div>
                    {r.description && (
                      <p className="text-muted-foreground mt-1 text-sm">{r.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 生成摘要 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              4. 生成摘要
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!summary && (
              <Button
                onClick={generateSummary}
                disabled={analyzing.summary}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {analyzing.summary ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  '生成摘要'
                )}
              </Button>
            )}
            {analyzing.summary && !summary && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
            {summary && (
              <div className="space-y-4">
                <p className="text-sm">{summary.standard}</p>
                <div className="space-y-2">
                  <span className="text-sm font-medium">关键点：</span>
                  <ul className="text-muted-foreground list-inside list-disc text-sm">
                    {summary.keyPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">结论：</span>
                  <p className="text-muted-foreground text-sm">{summary.conclusion}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href={`/reviews/${reviewId}/report`}>查看完整评审报告 →</Link>
        </Button>
      </div>
    </div>
  )
}
