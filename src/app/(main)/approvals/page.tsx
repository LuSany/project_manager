'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ApprovalTable } from '@/components/approvals/ApprovalTable'
import { useToast } from '@/hooks/use-toast'

interface ApprovalRecord {
  id: string
  bookingId: string
  approverId: string
  level: number
  action: string
  comment?: string
  createdAt: string
  bookings: {
    id: string
    startTime: string
    endTime: string
    status: string
    devices: {
      name: string
      device_types: {
        name: string
      }
    }
    users: {
      id: string
      name: string
    }
    projects: {
      id: string
      name: string
    } | null
  }
  users: {
    id: string
    name: string
  }
}

interface ApprovalStats {
  pending: number
  approvedToday: number
  totalProcessed: number
}

async function fetchApprovalRecords(
  status: string
): Promise<{ items: ApprovalRecord[]; total: number }> {
  const params = new URLSearchParams({ status, pageSize: '50' })
  const res = await fetch(`/api/v1/approval-records?${params}`, { credentials: 'include' })
  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || '获取审批记录失败')
  }
  return json.data
}

async function fetchApprovalStats(): Promise<ApprovalStats> {
  // Fetch all pending records
  const pendingRes = await fetch('/api/v1/approval-records?status=PENDING&pageSize=100', {
    credentials: 'include',
  })
  const pendingJson = await pendingRes.json()
  const pendingCount = pendingJson.success ? pendingJson.data.total : 0

  // Fetch all approved records for today count
  const approvedRes = await fetch('/api/v1/approval-records?status=APPROVED&pageSize=100', {
    credentials: 'include',
  })
  const approvedJson = await approvedRes.json()
  const approvedRecords = approvedJson.success ? approvedJson.data.items : []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const approvedToday = approvedRecords.filter(
    (r: ApprovalRecord) => new Date(r.createdAt) >= today
  ).length

  // Fetch all rejected records
  const rejectedRes = await fetch('/api/v1/approval-records?status=REJECTED&pageSize=100', {
    credentials: 'include',
  })
  const rejectedJson = await rejectedRes.json()
  const rejectedTotal = rejectedJson.success ? rejectedJson.data.total : 0

  return {
    pending: pendingCount,
    approvedToday,
    totalProcessed: approvedRecords.length + rejectedTotal,
  }
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('PENDING')
  const { toast } = useToast()

  // Map tab value to API status
  const statusMap: Record<string, string> = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  }

  const {
    data: recordsData,
    isLoading: recordsLoading,
    refetch,
  } = useQuery({
    queryKey: ['approval-records', activeTab],
    queryFn: () => fetchApprovalRecords(statusMap[activeTab]),
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: fetchApprovalStats,
  })

  const handleActionComplete = () => {
    refetch()
    toast({ title: '操作成功', variant: 'success' })
  }

  // Reset pagination when tab changes - we don't have pagination in this simple implementation
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">审批管理</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="待审批"
          icon={Clock}
          value={stats?.pending ?? 0}
          color="amber"
          loading={statsLoading}
        />
        <MetricCard
          title="今日已批"
          icon={CheckCircle}
          value={stats?.approvedToday ?? 0}
          color="green"
          loading={statsLoading}
        />
        <MetricCard
          title="总处理量"
          icon={FileText}
          value={stats?.totalProcessed ?? 0}
          color="blue"
          loading={statsLoading}
        />
      </div>

      {/* Tabs and Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="PENDING">待审批</TabsTrigger>
              <TabsTrigger value="APPROVED">已审批</TabsTrigger>
              <TabsTrigger value="REJECTED">已拒绝</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recordsData?.items && recordsData.items.length > 0 ? (
            <ApprovalTable records={recordsData.items} onActionComplete={handleActionComplete} />
          ) : (
            <div className="text-muted-foreground py-12 text-center">暂无审批记录</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
