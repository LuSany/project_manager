'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Risk {
  id: string
  title: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  probability: number
  impact: number
  status: string
  projects?: {
    id: string
    name: string
  }
}

interface RiskStats {
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export function RiskOverview() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [stats, setStats] = useState<RiskStats>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/risks', {
          credentials: 'include',
        })
        const data = await response.json()
        if (data.success) {
          setRisks(data.data.risks || [])
          const riskStats = data.data.stats || { critical: 0, high: 0, medium: 0, low: 0 }
          setStats({
            ...riskStats,
            total: riskStats.critical + riskStats.high + riskStats.medium + riskStats.low,
          })
        }
      } catch (e) {
        console.error('获取风险失败:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchRisks()
  }, [])

  const getRiskLevelConfig = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return { label: '关键', bg: 'bg-red-500', text: 'text-white', ring: 'ring-red-200' }
      case 'HIGH':
        return { label: '高', bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-200' }
      case 'MEDIUM':
        return { label: '中', bg: 'bg-amber-400', text: 'text-slate-800', ring: 'ring-amber-200' }
      default:
        return { label: '低', bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-200' }
    }
  }

  const statItems = [
    {
      key: 'critical',
      label: '关键',
      count: stats.critical,
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'high',
      label: '高',
      count: stats.high,
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-600 dark:text-orange-400',
    },
    {
      key: 'medium',
      label: '中',
      count: stats.medium,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'low',
      label: '低',
      count: stats.low,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            风险概览
          </CardTitle>
          <Link href="/risks">
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <CardDescription>共 {stats.total} 个活跃风险</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          </div>
        ) : risks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingDown className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">暂无活跃风险</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">项目风险状况良好</p>
          </div>
        ) : (
          <>
            {/* 风险统计条 */}
            <div className="mb-4 grid grid-cols-4 gap-2">
              {statItems.map((item) => (
                <div key={item.key} className={cn('rounded-lg p-2 text-center', item.bg)}>
                  <div className={cn('text-xl font-bold', item.text)}>{item.count}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>

            {/* 风险矩阵小型可视化 */}
            <div className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">风险矩阵</div>
              <div className="grid grid-cols-5 gap-1">
                {[5, 4, 3, 2, 1].map((prob) =>
                  Array.from({ length: 5 }, (_, i) => {
                    const impact = i + 1
                    const score = prob * impact
                    const hasRisk = risks.some(
                      (r) => r.probability >= prob - 1 && r.impact >= impact - 1
                    )
                    let bg = 'bg-slate-200 dark:bg-slate-700'
                    if (score >= 15) bg = 'bg-red-400'
                    else if (score >= 10) bg = 'bg-orange-400'
                    else if (score >= 5) bg = 'bg-amber-300'
                    else if (score >= 1) bg = 'bg-emerald-400'

                    return (
                      <div
                        key={`${prob}-${impact}`}
                        className={cn(
                          'h-3 rounded-sm transition-colors',
                          bg,
                          hasRisk && 'ring-1 ring-slate-400'
                        )}
                      />
                    )
                  })
                )}
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>低影响</span>
                <span>高影响</span>
              </div>
            </div>

            {/* 高优先级风险列表 */}
            <div className="space-y-2">
              {risks
                .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
                .slice(0, 3)
                .map((risk) => {
                  const config = getRiskLevelConfig(risk.riskLevel)
                  return (
                    <div
                      key={risk.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('h-2 w-2 rounded-full', config.bg)} />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {risk.title}
                          </p>
                          {risk.projects && (
                            <p className="text-xs text-slate-500">{risk.projects.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        P:{risk.probability} × I:{risk.impact}
                      </div>
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
