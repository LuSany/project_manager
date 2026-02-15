'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { CheckedState } from '@radix-ui/react-checkbox'

interface ReviewItemFormProps {
  reviewId: string
  onSuccess?: () => void
}

export function ReviewItemForm({ reviewId, onSuccess }: ReviewItemFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title) return

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, isRequired }),
      })

      if (response.ok) {
        alert('评审项创建成功')
        setTitle('')
        setCategory('')
        setIsRequired(false)
        onSuccess?.()
      } else {
        alert('创建失败')
      }
    } catch (err) {
      alert('创建失败：' + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加评审项</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">评审项标题</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入评审项标题"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">类别</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例如：功能、性能、安全"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked as boolean)}
            />
            <label htmlFor="required" className="text-sm">
              必填项
            </label>
          </div>

          <Button type="submit" disabled={loading || !title}>
            {loading ? '创建中...' : '创建'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
