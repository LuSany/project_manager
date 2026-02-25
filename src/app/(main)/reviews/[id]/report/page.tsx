'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ReportData {
  review: {
    id: string
    title: string
    type: string
    status: string
    createdAt: string
  }
  materials: Array<{ fileName: string; fileType: string; fileSize: number }>
  criteria: Array<{ title: string; description?: string }>
  risks: Array<{ title: string; category: string; riskLevel: string }>
  summary: {
    short: string
    standard: string
    detailed: string
    keyPoints: string[]
    conclusion: string
  } | null
}

export default function ReviewReportPage() {
  const params = useParams()
  const reviewId = params.id as string
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/v1/reports/review/${reviewId}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error || '加载失败')
        }
      } catch {
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [reviewId])

  const downloadReport = async (format: string) => {
    window.open(`/api/v1/reports/review/${reviewId}?format=${format}`, '_blank')
  }

  if (loading) return <div className="p-8">加载中...</div>
  if (error) return <div className="p-8 text-red-600">错误：{error}</div>
  if (!data) return null

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{data.review.title}</h1>
        <p className="text-gray-600">
          评审类型：{data.review.type} | 状态：{data.review.status}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => downloadReport('pdf')}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          下载 PDF
        </button>
        <button
          onClick={() => downloadReport('docx')}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          下载 Word
        </button>
        <button
          onClick={() => downloadReport('html')}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          下载 HTML
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 border-b pb-2 text-xl font-semibold">评审材料</h2>
          <ul className="space-y-2">
            {data.materials.map((m, i) => (
              <li key={i} className="text-gray-700">
                {i + 1}. {m.fileName} ({m.fileType}, {(m.fileSize / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 border-b pb-2 text-xl font-semibold">评审检查项</h2>
          <ul className="space-y-2">
            {data.criteria.map((c, i) => (
              <li key={i} className="text-gray-700">
                <strong>
                  {i + 1}. {c.title}
                </strong>
                {c.description && <p className="ml-4 text-gray-600">{c.description}</p>}
              </li>
            ))}
          </ul>
        </section>

        {data.risks.length > 0 && (
          <section>
            <h2 className="mb-3 border-b pb-2 text-xl font-semibold">识别的风险</h2>
            <ul className="space-y-2">
              {data.risks.map((r, i) => (
                <li
                  key={i}
                  className={`font-medium ${
                    r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH'
                      ? 'text-red-600'
                      : r.riskLevel === 'MEDIUM'
                        ? 'text-orange-600'
                        : 'text-green-600'
                  }`}
                >
                  {i + 1}. {r.title} [{r.riskLevel}]
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.summary && (
          <section className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-3 text-xl font-semibold">评审摘要</h2>
            <p className="mb-4 text-gray-700">{data.summary.standard}</p>
            <h3 className="mb-2 font-semibold">关键点</h3>
            <ul className="mb-4 list-inside list-disc">
              {data.summary.keyPoints.map((p, i) => (
                <li key={i} className="text-gray-700">
                  {p}
                </li>
              ))}
            </ul>
            <h3 className="mb-2 font-semibold">结论</h3>
            <p className="text-gray-700">{data.summary.conclusion}</p>
          </section>
        )}
      </div>
    </div>
  )
}
