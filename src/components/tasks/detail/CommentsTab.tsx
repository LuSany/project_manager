'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react'

// ============================================================================
// 类型定义
// ============================================================================

interface Comment {
  id: string
  content: string
  userId: string
  user: { id: string; name: string; email: string; avatar?: string | null }
  createdAt: string
  updatedAt: string
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

async function deleteComment(taskId: string, commentId: string): Promise<void> {
  const response = await fetch(`/api/v1/tasks/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
  })

  const data: ApiResponse<void> = await response.json()

  if (!data.success) {
    throw new Error(data.error || '删除评论失败')
  }
}

// ============================================================================
// CommentsTab 组件
// ============================================================================

export function CommentsTab({ taskId }: CommentsTabProps) {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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

  // 删除评论
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
    },
    onError: (error) => {
      console.error('删除评论失败:', error)
    },
  })

  // 处理发送评论
  const handleSend = () => {
    if (newComment.trim()) {
      createMutation.mutate(newComment.trim())
    }
  }

  // 处理删除评论
  const handleDelete = (commentId: string) => {
    setDeleteTarget(commentId)
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
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="max-h-[300px] flex-1 space-y-4 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-3 h-12 w-12 opacity-40" />
            <p className="text-sm">暂无评论</p>
            <p className="text-muted-foreground mt-1 text-xs">成为第一个评论者</p>
          </div>
        ) : (
          [...comments]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((comment) => (
              <div key={comment.id} className="group flex gap-3 border-b pb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.avatar || ''} alt={comment.user.name} />
                  <AvatarFallback>
                    {comment.user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.user.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      {comment.updatedAt !== comment.createdAt && (
                        <span className="text-muted-foreground text-xs">(已编辑)</span>
                      )}
                    </div>
                    {currentUser && currentUser.id === comment.userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="text-muted-foreground h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          placeholder="添加评论..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyPress}
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

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除评论</DialogTitle>
            <DialogDescription>确定要删除这条评论吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget)
                }
                setDeleteTarget(null)
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
