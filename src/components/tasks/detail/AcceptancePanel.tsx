'use client'

import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface AcceptancePanelProps {
  taskId: string
  acceptorId: string
  currentUserId: string
}

export function AcceptancePanel({ taskId, acceptorId, currentUserId }: AcceptancePanelProps) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')

  // 仅验收人可见
  if (acceptorId !== currentUserId) {
    return null
  }

  const acceptMutation = useMutation({
    mutationFn: (result: 'PASSED' | 'FAILED') =>
      fetch(`/api/v1/tasks/${taskId}/acceptance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, notes }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['acceptances', taskId] })
    },
  })

  const handleAccept = (result: 'PASSED' | 'FAILED') => {
    if (result === 'FAILED' && !notes.trim()) {
      alert('验收不通过时请填写意见')
      return
    }
    acceptMutation.mutate(result)
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-lg text-orange-700">验收操作</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="验收意见（不通过时必填）..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAccept('PASSED')}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            验收通过
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAccept('FAILED')}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            验收不通过
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
