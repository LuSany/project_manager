'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollText, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface AcceptanceRecord {
  id: string
  taskId: string
  requesterId: string
  acceptorId: string
  result: 'PENDING' | 'PASSED' | 'FAILED'
  notes: string | null
  createdAt: string
  updatedAt: string
  requester: {
    id: string
    name: string
    email: string
  }
  acceptor: {
    id: string
    name: string
    email: string
  }
}

interface AcceptanceHistoryProps {
  taskId: string
}

async function fetchAcceptanceHistory(taskId: string): Promise<AcceptanceRecord[]> {
  const response = await fetch(`/api/v1/tasks/${taskId}/acceptance`)
  const data = await response.json()
  if (!data.success) throw new Error(data.error || '获取验收记录失败')
  return data.data || []
}

const statusConfig = {
  PENDING: {
    label: '待验收',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  PASSED: {
    label: '已通过',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  FAILED: {
    label: '未通过',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
}

export function AcceptanceHistory({ taskId }: AcceptanceHistoryProps) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['acceptances', taskId],
    queryFn: () => fetchAcceptanceHistory(taskId),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="h-5 w-5" />
            验收历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="h-5 w-5" />
            验收历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">暂无验收记录</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScrollText className="h-5 w-5" />
          验收历史
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {records.map((record) => {
          const config = statusConfig[record.result]
          const StatusIcon = config.icon

          return (
            <div key={record.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <Badge className={config.color}>{config.label}</Badge>
                </div>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm', {
                    locale: zhCN,
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">发起人：</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {record.requester.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{record.requester.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">验收人：</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {record.acceptor.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{record.acceptor.name}</span>
                  </div>
                </div>
              </div>

              {record.notes && (
                <div className="bg-muted rounded-md p-3 text-sm">
                  <span className="text-muted-foreground">验收意见：</span>
                  <p className="mt-1">{record.notes}</p>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
