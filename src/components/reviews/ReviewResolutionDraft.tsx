'use client'

import * as React from 'react'
import { Loader2, Edit2, Check, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ReviewResolutionDraftProps {
  reviewId: string
  isModerator: boolean
  onDraftConfirmed?: () => void
  className?: string
  previewMode?: boolean
}

export function ReviewResolutionDraft({
  reviewId,
  isModerator,
  onDraftConfirmed,
  className,
  previewMode = false,
}: ReviewResolutionDraftProps) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedDraft, setEditedDraft] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchDraft()
  }, [reviewId])

  const fetchDraft = async () => {
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/resolution-draft`)
      const json = await res.json()
      if (json.success && json.draft) {
        setDraft(json.draft.markdown)
        setGeneratedAt(json.draft.generatedAt)
      }
    } catch {
      // Draft not found, silently handle
    }
  }

  const generateDraft = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/resolution-draft`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success && json.draft) {
        setDraft(json.draft.markdown)
        setGeneratedAt(json.draft.generatedAt)
      } else {
        setError(json.error || '生成失败')
      }
    } catch {
      setError('生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const startEdit = () => {
    setEditedDraft(draft || '')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditedDraft('')
  }

  const saveDraft = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/resolution-draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: editedDraft }),
      })
      const json = await res.json()
      if (json.success) {
        setDraft(editedDraft)
        setIsEditing(false)
      } else {
        setError(json.error || '保存失败')
      }
    } catch {
      setError('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDraft = async () => {
    if (!confirm('确定要将此草案确认为正式决议吗？')) return

    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/resolution-confirm`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        onDraftConfirmed?.()
      } else {
        setError(json.error || '确认失败')
      }
    } catch {
      setError('确认失败')
    } finally {
      setIsSaving(false)
    }
  }

  if (!draft && !isGenerating) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            AI 决议草案
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            评审完成后可生成 AI 决议草案，由主持人编辑确认后成为正式决议。
          </p>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={generateDraft}
            disabled={previewMode}
          >
            <Sparkles className="h-4 w-4" />
            生成决议草案
          </Button>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            AI 决议草案
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI 生成
          </Badge>
        </div>
        {generatedAt && (
          <p className="text-muted-foreground text-xs">
            生成时间: {new Date(generatedAt).toLocaleString('zh-CN')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isGenerating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm">生成中...</span>
          </div>
        )}

        {!isGenerating && draft && (
          <>
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editedDraft}
                  onChange={(e) => setEditedDraft(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="编辑决议草案..."
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={cancelEdit}>
                    取消
                  </Button>
                  <Button onClick={saveDraft} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        保存
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-muted/50 max-h-[400px] overflow-y-auto rounded-md border p-4 font-mono text-sm whitespace-pre-wrap">
                  {draft}
                </div>
                {!previewMode && isModerator && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={startEdit}>
                      <Edit2 className="h-4 w-4" />
                      编辑
                    </Button>
                    <Button className="gap-2" onClick={confirmDraft} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          确认中...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          确认决议
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {previewMode && (
                  <p className="text-muted-foreground text-xs">
                    评审完成后，主持人可编辑并确认此草案
                  </p>
                )}
              </>
            )}
          </>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
