'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'

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

export default function ReviewAiAnalysisPage() {
  const params = useParams()
  const reviewId = params.id as string

  const [analyzing, setAnalyzing] = useState<{ [key: string]: boolean }>({})
  const [materialAnalysis, setMaterialAnalysis] = useState<AnalysisResult | null>(null)
  const [criteria, setCriteria] = useState<Criteria[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeMaterials = async () => {
    setAnalyzing((prev) => ({ ...prev, materials: true }))
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
      <div className="flex items-center gap-2 mb-4">
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

      {error && <div className="mb-6 rounded bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">1. 材料分析</h2>
          <button
            onClick={analyzeMaterials}
            disabled={analyzing.materials}
            className="mb-4 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {analyzing.materials ? '分析中...' : '开始分析材料'}
          </button>
          {materialAnalysis && (
            <div className="space-y-2 text-sm">
              <div className="text-2xl font-bold text-blue-600">
                {materialAnalysis.completenessScore}分
              </div>
              <p className="text-gray-700">{materialAnalysis.analysis}</p>
              {materialAnalysis.missingItems.length > 0 && (
                <div>
                  <strong>缺失项:</strong>
                  <ul className="list-inside list-disc text-gray-600">
                    {materialAnalysis.missingItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">2. 生成检查项</h2>
          <button
            onClick={generateCriteria}
            disabled={analyzing.criteria}
            className="mb-4 w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
          >
            {analyzing.criteria ? '生成中...' : '生成检查项'}
          </button>
          {criteria.length > 0 && (
            <ul className="max-h-64 space-y-2 overflow-auto text-sm">
              {criteria.map((c, i) => (
                <li key={i} className="border-b pb-2">
                  <strong>{c.title}</strong>
                  {c.description && <p className="text-gray-600">{c.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">3. 风险识别</h2>
          <button
            onClick={identifyRisks}
            disabled={analyzing.risks}
            className="mb-4 w-full rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:bg-gray-400"
          >
            {analyzing.risks ? '识别中...' : '识别风险'}
          </button>
          {risks.length > 0 && (
            <ul className="max-h-64 space-y-2 overflow-auto text-sm">
              {risks.map((r, i) => (
                <li
                  key={i}
                  className={`border-b pb-2 ${
                    r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH'
                      ? 'text-red-600'
                      : r.riskLevel === 'MEDIUM'
                        ? 'text-orange-600'
                        : 'text-green-600'
                  }`}
                >
                  <strong>{r.title}</strong> [{r.riskLevel}]
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">4. 生成摘要</h2>
          <button
            onClick={generateSummary}
            disabled={analyzing.summary}
            className="mb-4 w-full rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400"
          >
            {analyzing.summary ? '生成中...' : '生成摘要'}
          </button>
          {summary && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">{summary.standard}</p>
              <div>
                <strong>关键点:</strong>
                <ul className="list-inside list-disc text-gray-600">
                  {summary.keyPoints.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>结论:</strong>
                <p className="text-gray-700">{summary.conclusion}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <a
          href={`/reviews/${reviewId}/report`}
          className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
        >
          查看完整评审报告 →
        </a>
      </div>
    </div>
  )
}
