'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义
// ============================================================================

interface Tag {
  id: string
  name: string
  color: string
}

interface TagsTabProps {
  taskId: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// API 函数
// ============================================================================

async function fetchTags(taskId: string): Promise<Tag[]> {
  const response = await fetch(`/api/v1/tasks/${taskId}/tags`)
  const data: ApiResponse<Tag[]> = await response.json()

  if (!data.success) {
    throw new Error(data.error || '获取标签失败')
  }

  return data.data || []
}

async function addTag(taskId: string, tagName: string): Promise<Tag> {
  const response = await fetch(`/api/v1/tasks/${taskId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: tagName }),
  })

  const data: ApiResponse<Tag> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '添加标签失败')
  }

  return data.data
}

async function removeTag(taskId: string, tagId: string): Promise<void> {
  const response = await fetch(`/api/v1/tasks/${taskId}/tags/${tagId}`, {
    method: 'DELETE',
  })

  const data: ApiResponse<null> = await response.json()

  if (!data.success) {
    throw new Error(data.error || '删除标签失败')
  }
}

// ============================================================================
// TagsTab 组件
// ============================================================================

export function TagsTab({ taskId }: TagsTabProps) {
  const queryClient = useQueryClient()
  const [newTagName, setNewTagName] = useState('')

  // 获取标签列表
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', taskId],
    queryFn: () => fetchTags(taskId),
  })

  // 添加标签
  const addMutation = useMutation({
    mutationFn: (name: string) => addTag(taskId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', taskId] })
      setNewTagName('')
    },
  })

  // 删除标签
  const removeMutation = useMutation({
    mutationFn: (tagId: string) => removeTag(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', taskId] })
    },
  })

  // 处理添加标签
  const handleAdd = () => {
    if (newTagName.trim()) {
      addMutation.mutate(newTagName.trim())
    }
  }

  // 处理回车添加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* 标签列表 */}
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <div className="w-full py-8 text-center text-muted-foreground">
            <p className="text-sm">暂无标签</p>
            <p className="text-xs mt-1">添加标签以便分类管理</p>
          </div>
        ) : (
          tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className={cn('flex items-center gap-1 px-3 py-1', tag.color)}
            >
              {tag.name}
              <button
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
                onClick={() => removeMutation.mutate(tag.id)}
                disabled={removeMutation.isPending}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* 添加标签输入 */}
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="添加新标签..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={addMutation.isPending}
        />
        <Button
          size="icon"
          onClick={handleAdd}
          disabled={addMutation.isPending || !newTagName.trim()}
        >
          {addMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}