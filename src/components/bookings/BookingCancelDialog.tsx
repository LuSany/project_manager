'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface BookingCancelDialogProps {
  bookingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BookingCancelDialog({
  bookingId,
  open,
  onOpenChange,
  onSuccess,
}: BookingCancelDialogProps) {
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] })
      onOpenChange(false)
      onSuccess?.()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            取消预定
          </DialogTitle>
          <DialogDescription>确定要取消此预定吗？取消后设备将恢复为可用状态。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? '处理中...' : '确认取消'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
