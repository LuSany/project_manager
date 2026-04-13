'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'

interface BookingCreatePopoverProps {
  deviceId: string
  startTime: Date
  endTime: Date
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BookingCreatePopover({
  deviceId,
  startTime,
  endTime,
  open,
  onOpenChange,
  onSuccess,
}: BookingCreatePopoverProps) {
  const [projectId, setProjectId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: projects } = useQuery({
    queryKey: ['projects-for-booking'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return (json.data?.items || json.data?.data || json.data) as any[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          projectId: projectId || undefined,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      })
      const json = await res.json()
      if (!json.success) {
        if (json.data?.conflictingBooking) {
          const conflict = json.data.conflictingBooking
          const start = format(new Date(conflict.startTime), 'MM-dd HH:mm')
          const end = format(new Date(conflict.endTime), 'HH:mm')
          const user = conflict.userName || '未知用户'
          const project = conflict.projectName || '未关联项目'
          setError(
            `时间段 ${start}-${end} 已被 ${user} 预定（项目: ${project}）`
          )
        } else {
          setError(json.error)
        }
        throw new Error(json.error)
      }
      return json.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device-bookings', deviceId] })
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })

      if (data.approval?.needsApproval) {
        toast({
          title: '预定已提交，等待审批',
          description: '您的预定申请需要等待审批，请留意审批通知',
        })
      } else {
        toast({
          title: '预定成功',
          description: '设备预定已确认',
          variant: 'success',
        })
      }

      onOpenChange(false)
      setProjectId('')
      setError('')
      onSuccess?.()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>创建预定</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-medium">预定时间段</p>
            <p className="text-muted-foreground text-sm">
              {format(startTime, 'yyyy-MM-dd HH:mm')} ~ {format(endTime, 'yyyy-MM-dd HH:mm')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">关联项目（可选）</label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
                {projects?.length === 0 && (
                  <div className="p-2 text-muted-foreground text-sm text-center">
                    暂无可关联的项目
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? '创建中...' : '确认预定'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
