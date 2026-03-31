'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RiskList } from '@/components/risks/RiskList'
import { AIRiskAnalysis } from '@/components/risks/AIRiskAnalysis'
import { ArrowLeft, Home } from 'lucide-react'

export default function RisksPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    params.then((p) => setProjectId(p.id))
  }, [params])

  const handleRiskCreated = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-muted-foreground py-8 text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回项目
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">风险管理</h1>
        <AIRiskAnalysis projectId={projectId} onRiskCreated={handleRiskCreated} />
      </div>

      <RiskList projectId={projectId} refreshKey={refreshKey} />
    </div>
  )
}
