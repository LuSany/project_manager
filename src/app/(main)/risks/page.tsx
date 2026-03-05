'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api/client'
import { Loader2, AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Risk {
  id: string
  title: string
  description?: string
  category: string
  probability: number
  impact: number
  riskLevel: string
  status: string
  progress: number
  projectId: string
  project: {
    id: string
    name: string
  }
  owner: {
    id: string
    name: string
  }
  createdAt: string
  dueDate?: string
}

const categoryLabels: Record<string, string> = {
  TECHNICAL: '技术风险',
  SCHEDULE: '进度风险',
  RESOURCE: '资源风险',
  BUDGET: '预算风险',
  EXTERNAL: '外部风险',
  MANAGEMENT: '管理风险',
}

const riskLevelColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
}

const riskLevelLabels: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '关键',
}

const statusLabels: Record<string, string> = {
  IDENTIFIED: '已识别',
  ANALYZING: '分析中',
  MITIGATING: '缓解中',
  MONITORING: '监控中',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
}

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  })

  useEffect(() => {
    fetchRisks()
  }, [])

  const fetchRisks = async () => {
    try {
      const response = await api.get('/risks?scope=all')
      const data = (response as { data?: Risk[] }).data || []
      setRisks(data)

      // 计算统计
      const total = data.length
      const critical = data.filter((r) => r.riskLevel === 'CRITICAL').length
      const high = data.filter((r) => r.riskLevel === 'HIGH').length
      const medium = data.filter((r) => r.riskLevel === 'MEDIUM').length
      const low = data.filter((r) => r.riskLevel === 'LOW').length
      setStats({ total, critical, high, medium, low })
    } catch (error) {
      console.error('获取风险列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRisks = risks.filter((risk) => {
    return riskLevelFilter === 'all' || risk.riskLevel === riskLevelFilter
  })

  // 按风险等级排序
  const sortedRisks = [...filteredRisks].sort((a, b) => {
    const levelOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return levelOrder[a.riskLevel as keyof typeof levelOrder] - levelOrder[b.riskLevel as keyof typeof levelOrder]
  })

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">风险看板</h1>
        </div>
        <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="风险等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            <SelectItem value="CRITICAL">关键</SelectItem>
            <SelectItem value="HIGH">高</SelectItem>
            <SelectItem value="MEDIUM">中</SelectItem>
            <SelectItem value="LOW">低</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">总风险</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">关键</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">高</span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-orange-600">{stats.high}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">中</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.medium}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">低</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{stats.low}</p>
          </CardContent>
        </Card>
      </div>

      {/* 风险列表 */}
      <div className="space-y-4">
        {sortedRisks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无风险数据
            </CardContent>
          </Card>
        ) : (
          sortedRisks.map((risk) => (
            <Link key={risk.id} href={`/projects/${risk.projectId}/risks`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={riskLevelColors[risk.riskLevel]}>
                          {riskLevelLabels[risk.riskLevel]}
                        </Badge>
                        <Badge variant="outline">
                          {categoryLabels[risk.category] || risk.category}
                        </Badge>
                        <Badge variant="secondary">
                          {statusLabels[risk.status] || risk.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium truncate">{risk.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>项目: {risk.project?.name}</span>
                        <span>负责人: {risk.owner?.name}</span>
                        {risk.dueDate && (
                          <span>截止: {new Date(risk.dueDate).toLocaleDateString('zh-CN')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm text-muted-foreground">概率 × 影响</div>
                      <div className="font-medium">
                        {risk.probability} × {risk.impact} = {risk.probability * risk.impact}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        进度: {risk.progress}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}