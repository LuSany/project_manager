'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, FileText, Users, CheckCircle2, Clock, Calendar, Download, Eye, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ReviewEditDialog } from '@/components/reviews/ReviewEditDialog'
import { ReviewComments } from '@/components/reviews/ReviewComments'
import { ReviewVoting } from '@/components/reviews/ReviewVoting'
import { ReviewStatusBanner } from '@/components/reviews/ReviewStatusBanner'

interface ReviewMaterial {
  id: string
  fileId: string  // 添加 fileId 字段
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
}

interface ReviewParticipant {
  user: {
    id: string
    name: string
    avatar: string | null
  }
  role: string
  joinedAt: string
}

interface ReviewItem {
  id: string
  title: string
  description: string | null
  category: string | null
  isRequired: boolean
  order: number
}

interface Review {
  id: string
  title: string
  description: string | null
  status: string
  scheduledAt: string | null
  createdAt: string
  type: {
    id: string
    name: string
    displayName: string
  }
  project: {
    id: string
    name: string
  }
  author: {
    id: string
    name: string
    avatar: string | null
    email: string
  } | null
  materials: ReviewMaterial[]
  participants: ReviewParticipant[]
  items: ReviewItem[]
}

export default function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string; reviewId: string }>
}) {
  const { id, reviewId } = use(params)
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)

  const fetchReview = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}`)

      // 检查 Content-Type 确保返回的是 JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status === 401) {
          setError('请先登录')
        } else {
          setError('服务器返回了无效的响应')
        }
        return
      }

      const data = await response.json()
      if (data.success) {
        setReview(data.data)
      } else {
        setError(data.error?.message || data.message || '获取评审详情失败')
      }
    } catch (err) {
      setError('获取评审详情失败')
      console.error('获取评审详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReview()
  }, [reviewId])

  // 获取当前用户
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          credentials: 'include',
        })

        // 检查 Content-Type
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('获取当前用户失败: 服务器返回了无效的响应')
          return
        }

        const data = await response.json()
        if (data.success && data.data?.id) {
          setCurrentUserId(data.data.id)
        }
      } catch (err) {
        console.error('获取当前用户失败:', err)
      }
    }
    fetchCurrentUser()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">待评审</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default">评审中</Badge>
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-600">
            已完成
          </Badge>
        )
      case 'CANCELLED':
        return <Badge variant="outline">已取消</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getParticipantRoleLabel = (role: string) => {
    switch (role) {
      case 'REVIEWER':
        return '评审人'
      case 'OBSERVER':
        return '观察者'
      case 'SECRETARY':
        return '记录员'
      default:
        return role
    }
  }

  // 预览文件
  const handlePreview = async (material: ReviewMaterial) => {
    try {
      // 获取预览URL
      const response = await fetch(`/api/v1/files/preview?fileId=${material.fileId}&service=auto`, { credentials: 'include' })
      const data = await response.json()

      if (data.success) {
        const { previewType } = data.data

        if (previewType === 'onlyoffice') {
          // Office文档：打开OnlyOffice预览页面
          window.open(`/files/${material.fileId}/preview`, '_blank')
        } else {
          // 图片、PDF等：直接打开文件
          window.open(`/api/v1/files/${material.fileId}`, '_blank')
        }
      } else {
        // 降级：直接打开文件
        window.open(`/api/v1/files/${material.fileId}`, '_blank')
      }
    } catch (err) {
      console.error('预览文件失败:', err)
      // 降级：直接打开文件
      window.open(`/api/v1/files/${material.fileId}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchReview}>重试</Button>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12">评审不存在</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${id}/reviews`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回评审列表
          </Button>
        </Link>
      </div>

      {/* 标题区 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{review.title}</h1>
            {getStatusBadge(review.status)}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>评审类型: {review.type.displayName}</span>
            {review.author && (
              <span>作者: {review.author.name}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            编辑评审
          </Button>
          <div className="text-muted-foreground text-right text-sm">
            {review.scheduledAt && (
              <div className="mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>计划时间: {format(new Date(review.scheduledAt), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>创建于: {format(new Date(review.createdAt), 'yyyy-MM-dd HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 描述 */}
      {review.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">{review.description}</p>
          </CardContent>
        </Card>
      )}

      {/* 评审状态横幅 */}
      <ReviewStatusBanner
        status={review.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'}
        scheduledAt={review.scheduledAt}
      />

      {/* 材料列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            评审材料 ({review.materials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {review.materials.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">暂无评审材料</div>
          ) : (
            <div className="space-y-2">
              {review.materials.map((material) => (
                <div
                  key={material.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">{material.fileName}</div>
                      <div className="text-muted-foreground text-xs">
                        {formatFileSize(material.fileSize)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground text-xs mr-2">
                      {format(new Date(material.uploadedAt), 'yyyy-MM-dd HH:mm')}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/api/v1/files/${material.fileId}`, '_blank')}
                      title="下载文件"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(material)}
                      title="预览文件"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 参与者列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            参与者 ({review.participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {review.participants.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">暂无参与者</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {review.participants.map((participant) => (
                <div
                  key={participant.user.id}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <span className="text-sm font-medium">{participant.user.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{participant.user.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {getParticipantRoleLabel(participant.role)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评审项目列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5" />
            评审项目 ({review.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {review.items.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">暂无评审项目</div>
          ) : (
            <div className="space-y-3">
              {review.items.map((item) => (
                <div key={item.id} className="hover:bg-muted/50 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    {item.isRequired && (
                      <Badge variant="outline" className="mt-1">
                        必填
                      </Badge>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-muted-foreground mt-1 text-sm">{item.description}</div>
                      )}
                      {item.category && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          分类: {item.category}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 投票面板 - 仅评审中状态显示 */}
      {review.status === 'IN_PROGRESS' && (
        <ReviewVoting
          reviewId={reviewId}
          currentUserId={currentUserId}
          isReviewer={review.participants.some(
            (p) => p.user.id === currentUserId && p.role === 'REVIEWER'
          )}
          onComplete={fetchReview}
        />
      )}

      {/* 评论区域 */}
      <Card>
        <CardContent className="pt-6">
          <ReviewComments
            reviewId={reviewId}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <ReviewEditDialog
        reviewId={reviewId}
        projectId={review.project.id}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchReview}
      />
    </div>
  )
}
