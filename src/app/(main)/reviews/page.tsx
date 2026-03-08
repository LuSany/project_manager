'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { Loader2, FileCheck, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

interface Review {
  id: string
  title: string
  type: {
    name: string
    displayName: string
  }
  status: string
  projectId: string
  project: {
    name: string
  }
  createdAt: string
  scheduledAt?: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  PENDING: '待评审',
  IN_PROGRESS: '评审中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await api.get('/reviews')
      const result = response as { data?: Review[]; meta?: { total: number } }
      setReviews(result.data || [])
    } catch (error) {
      console.error('获取评审列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="h-6 w-6" />
          我的评审
        </h1>
        <p className="text-muted-foreground">查看和管理您参与的评审</p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无评审数据
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{review.title}</h3>
                      <Badge className={statusColors[review.status]}>
                        {statusLabels[review.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      类型：{review.type?.displayName || review.type?.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        项目：{review.project?.name}
                      </span>
                      {review.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          计划：{new Date(review.scheduledAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${review.projectId}/reviews/${review.id}`}>
                      <Button variant="outline" size="sm">查看详情</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}