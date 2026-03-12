'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WizardData } from '../ReviewWizard'

interface BasicInfoStepProps {
  data: Pick<WizardData, 'title' | 'description' | 'typeId' | 'scheduledAt'>
  onChange: (data: Partial<WizardData>) => void
}

interface ReviewType {
  id: string
  name: string
  displayName: string
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [types, setTypes] = useState<ReviewType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/reviews/types?isActive=true')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setTypes(result.data || [])
        }
      })
      .catch((err) => console.error('获取评审类型失败:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">
          评审标题 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="请输入评审标题"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">
          评审类型 <span className="text-destructive">*</span>
        </Label>
        {loading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : types.length === 0 ? (
          <div className="text-sm text-yellow-600">暂无可用评审类型，请联系管理员</div>
        ) : (
          <Select value={data.typeId} onValueChange={(value) => onChange({ typeId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="选择评审类型" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="请输入评审描述（可选）"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">计划时间</Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          value={data.scheduledAt}
          onChange={(e) => onChange({ scheduledAt: e.target.value })}
        />
      </div>
    </div>
  )
}