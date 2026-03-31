'use client'

import * as React from 'react'
import { Brain, Loader2, ChevronDown } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MaterialAnalysisResult {
  completenessScore: number
  analysis: string
  missingItems: string[]
  suggestions: string[]
}

interface IdentifiedRisk {
  title: string
  description?: string
  category: 'TECHNICAL' | 'SCHEDULE' | 'RESOURCE' | 'BUDGET' | 'EXTERNAL' | 'MANAGEMENT'
  probability: number
  impact: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  mitigation?: string
  recommendation?: string
}

interface ReviewSummary {
  short: string
  keyPoints: string[]
}

interface ReviewAISidebarProps {
  reviewId: string
  className?: string
}

const categoryLabels: Record<string, string> = {
  TECHNICAL: '技术',
  SCHEDULE: '进度',
  RESOURCE: '资源',
  BUDGET: '预算',
  EXTERNAL: '外部',
  MANAGEMENT: '管理',
}

const riskLevelColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function ReviewAISidebar({ reviewId, className }: ReviewAISidebarProps) {
  const [open, setOpen] = React.useState(false)
  const [sectionsOpen, setSectionsOpen] = React.useState({
    materials: true,
    risks: true,
    summary: true,
  })

  const [materialAnalysis, setMaterialAnalysis] = React.useState<MaterialAnalysisResult | null>(
    null
  )
  const [risks, setRisks] = React.useState<IdentifiedRisk[]>([])
  const [summary, setSummary] = React.useState<ReviewSummary | null>(null)

  const [loading, setLoading] = React.useState({
    materials: false,
    risks: false,
    summary: false,
  })

  const [errors, setErrors] = React.useState({
    materials: null as string | null,
    risks: null as string | null,
    summary: null as string | null,
  })

  const analyzeMaterials = async () => {
    if (materialAnalysis) return
    setLoading((prev) => ({ ...prev, materials: true }))
    setErrors((prev) => ({ ...prev, materials: null }))
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-analyze`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setMaterialAnalysis(json.result)
      } else {
        setErrors((prev) => ({ ...prev, materials: json.error || '分析失败' }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, materials: '分析失败' }))
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }))
    }
  }

  const identifyRisks = async () => {
    if (risks.length > 0) return
    setLoading((prev) => ({ ...prev, risks: true }))
    setErrors((prev) => ({ ...prev, risks: null }))
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-identify-risks`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setRisks(json.result)
      } else {
        setErrors((prev) => ({ ...prev, risks: json.error || '识别失败' }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, risks: '识别失败' }))
    } finally {
      setLoading((prev) => ({ ...prev, risks: false }))
    }
  }

  const generateSummary = async () => {
    if (summary) return
    setLoading((prev) => ({ ...prev, summary: true }))
    setErrors((prev) => ({ ...prev, summary: null }))
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/ai-generate-summary`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSummary(json.result?.fullSummary || json.result)
      } else {
        setErrors((prev) => ({ ...prev, summary: json.error || '生成失败' }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, summary: '生成失败' }))
    } finally {
      setLoading((prev) => ({ ...prev, summary: false }))
    }
  }

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className={cn('gap-2', className)}>
          <Brain className="h-4 w-4" />
          AI 分析
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI 评审分析
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* 材料分析 */}
          <Card>
            <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection('materials')}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">材料分析</CardTitle>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sectionsOpen.materials && 'rotate-180'
                  )}
                />
              </div>
            </CardHeader>
            {sectionsOpen.materials && (
              <CardContent className="space-y-4 pt-0">
                {!materialAnalysis && !loading.materials && (
                  <Button variant="outline" size="sm" className="w-full" onClick={analyzeMaterials}>
                    开始分析材料
                  </Button>
                )}
                {loading.materials && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">分析中...</span>
                  </div>
                )}
                {errors.materials && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {errors.materials}
                  </div>
                )}
                {materialAnalysis && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>完整性评分</span>
                        <span className="font-medium">{materialAnalysis.completenessScore}分</span>
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
                      <div className="space-y-1">
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
            )}
          </Card>

          {/* 风险识别 */}
          <Card>
            <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection('risks')}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">风险识别</CardTitle>
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', sectionsOpen.risks && 'rotate-180')}
                />
              </div>
            </CardHeader>
            {sectionsOpen.risks && (
              <CardContent className="space-y-4 pt-0">
                {risks.length === 0 && !loading.risks && (
                  <Button variant="outline" size="sm" className="w-full" onClick={identifyRisks}>
                    识别风险
                  </Button>
                )}
                {loading.risks && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">识别中...</span>
                  </div>
                )}
                {errors.risks && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {errors.risks}
                  </div>
                )}
                {risks.length > 0 && (
                  <div className="space-y-3">
                    {risks.map((risk, i) => (
                      <div key={i} className="space-y-2 rounded-lg border p-3">
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium">{risk.title}</span>
                          <Badge className={cn(riskLevelColors[risk.riskLevel])}>
                            {risk.riskLevel}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[risk.category] || risk.category}
                          </Badge>
                          <span>概率: {risk.probability}%</span>
                          <span>影响: {risk.impact}%</span>
                        </div>
                        {risk.description && (
                          <p className="text-muted-foreground text-sm">{risk.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* 关键信息提取 */}
          <Card>
            <CardHeader className="cursor-pointer py-3" onClick={() => toggleSection('summary')}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">关键信息提取</CardTitle>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sectionsOpen.summary && 'rotate-180'
                  )}
                />
              </div>
            </CardHeader>
            {sectionsOpen.summary && (
              <CardContent className="space-y-4 pt-0">
                {!summary && !loading.summary && (
                  <Button variant="outline" size="sm" className="w-full" onClick={generateSummary}>
                    提取关键信息
                  </Button>
                )}
                {loading.summary && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">提取中...</span>
                  </div>
                )}
                {errors.summary && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {errors.summary}
                  </div>
                )}
                {summary && (
                  <div className="space-y-4">
                    <p className="text-sm">{summary.short}</p>
                    {summary.keyPoints.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">关键点：</span>
                        <ul className="text-muted-foreground list-inside list-disc text-sm">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
