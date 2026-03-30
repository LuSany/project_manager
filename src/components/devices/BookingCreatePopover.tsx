'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
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
  const queryClient = useQueryClient()

  const { data: projects } = useQuery({
    queryKey: ['projects-for-booking'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items
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
          setError(
            `与现有预定冲突: ${format(new Date(json.data.conflictingBooking.startTime), 'MM-dd HH:mm')}`
          )
        } else {
          setError(json.error)
        }
        throw new Error(json.error)
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-bookings', deviceId] })
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
      onOpenChange(false)
      setProjectId('')
      setError('')
      onSuccess?.()
    },
  })

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full">
          创建预定
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
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
                <SelectItem value="">不关联项目</SelectItem>
                {projects?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
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
      </PopoverContent>
    </Popover>
  )
}
