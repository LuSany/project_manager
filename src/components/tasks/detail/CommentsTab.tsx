'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义
// ============================================================================

interface Comment {
  id: string
  content: string
  userId: string
  user: { id: string; name: string; email: string }
  createdAt: string
}

interface CommentsTabProps {
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

async function fetchComments(taskId: string): Promise<Comment[]> {
  const response = await fetch(`/api/v1/tasks/${taskId}/comments`)
  const data: ApiResponse<Comment[]> = await response.json()

  if (!data.success) {
    throw new Error(data.error || '获取评论失败')
  }

  return data.data || []
}

async function createComment(taskId: string, content: string): Promise<Comment> {
  const response = await fetch(`/api/v1/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  const data: ApiResponse<Comment> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '创建评论失败')
  }

  return data.data
}

// ============================================================================
// CommentsTab 组件
// ============================================================================

export function CommentsTab({ taskId }: CommentsTabProps) {
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')

  // 获取评论列表
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => fetchComments(taskId),
  })

  // 创建评论
  const createMutation = useMutation({
    mutationFn: (content: string) => createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
      setNewComment('')
    },
  })

  // 处理发送评论
  const handleSend = () => {
    if (newComment.trim()) {
      createMutation.mutate(newComment.trim())
    }
  }

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 格式化相对时间
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    return date.toLocaleDateString('zh-CN')
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4">
      {/* 评论列表 */}
      <div className="flex-1 space-y-4 overflow-y-auto" style={{ maxHeight: '300px' }}>
        {comments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">暂无评论</p>
            <p className="text-xs mt-1">成为第一个评论者</p>
          </div>
        ) : (
          // 按时间倒序排列
          [...comments]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((comment) => (
              <div key={comment.id} className="flex gap-3 border-b pb-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            ))
        )}
      </div>

      {/* 输入区域 */}
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="添加评论..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={createMutation.isPending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={createMutation.isPending || !newComment.trim()}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}