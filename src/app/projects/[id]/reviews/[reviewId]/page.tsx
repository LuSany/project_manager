'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';
import { materialUpload } from '@/components/reviews/materialUpload';
import { AddParticipant } from '@/components/reviews/AddParticipant';
import { ReviewItemForm } from '@/components/reviews/ReviewItemForm';
import Link from 'next/link';

interface Review {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduledAt?: string;
  type: {
    displayName: string;
  };
  materials: Array<{
    id: string;
    fileName: string;
  }>;
  participants: Array<{
    id: string;
    user: {
      name: string;
    };
    role: string;
  }>;
  items: Array<{
    id: string;
    title: string;
    category?: string;
    isRequired: boolean;
  }>;
}

export default function ReviewDetailPage({
  params,
}: {
  params: { id: string; reviewId: string };
}) {
  const [review, setReview] = useState<Review | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviewDetail = async () => {
      try {
        const response = await fetch(`/api/v1/reviews/${params.reviewId}`);
        const data = await response.json();
        if (data.success) {
          setReview(data.data);
        }
      } catch (err) {
        console.error('获取评审详情失败:', err);
      }
    };

    const fetchMaterials = async () => {
      try {
        const response = await fetch(`/api/v1/files?uploadedBy=${review?.materials?.[0]?.uploadedBy || ''}`);
        const data = await response.json();
        if (data.success) {
          setMaterials(data.data || []);
        }
      } catch (err) {
        console.error('获取材料列表失败:', err);
      }
    };

    fetchReviewDetail();
    fetchMaterials();
  }, [params.reviewId]);

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('确定要移除该参与者吗？')) return;

    try {
      const response = await fetch(`/api/v1/reviews/${params.reviewId}/participants/${participantId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        // 重新加载评审详情
        window.location.reload();
      }
    } catch (err) {
      console.error('移除参与者失败:', err);
    }
  };

  if (!review) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href={`/projects/${params.id}/reviews`} className="text-muted-foreground hover:underline">
            ← 返回评审列表
          </Link>
          <h1 className="text-2xl font-bold ml-4">{review.title}</h1>
        </div>
        <Badge variant="secondary">{review.type.displayName}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧列 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>评审信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-muted-foreground">状态：</span>
                <Badge className="ml-2">{review.status === 'PENDING' ? '待评审' : review.status === 'IN_PROGRESS' ? '评审中' : '已完成'}</Badge>
              </div>
              {review.scheduledAt && (
                <div>
                  <span className="text-muted-foreground">计划时间：</span>
                  <span className="ml-2">{format(new Date(review.scheduledAt), 'yyyy-MM-dd HH:mm')}</span>
                </div>
              )}
              {review.description && (
                <div>
                  <span className="text-muted-foreground">描述：</span>
                  <p className="ml-2 mt-1">{review.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评审项</CardTitle>
              <div className="flex gap-2 mt-2">
                <ReviewItemForm reviewId={params.reviewId} onSuccess={() => window.location.reload()} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {review.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{item.title}</span>
                      {item.category && <span className="text-sm text-muted-foreground ml-2">({item.category})</span>}
                      {item.isRequired && <Badge variant="destructive" className="ml-2">必填</Badge>}
                    </div>
                  </div>
                ))}
              {(!review.items || review.items.length === 0) && (
                <div className="text-center text-muted-foreground py-4">
                    暂无评审项
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评审材料</CardTitle>
              <div className="flex gap-2 mt-2">
                <materialUpload reviewId={params.reviewId} onSuccess={() => window.location.reload()} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {materials.map((material: any) => (
                <div key={material.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{material.fileName}</span>
                    <Button variant="ghost" size="sm">下载</Button>
                  </div>
                ))}
              {materials.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                    暂无材料
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>参与者</CardTitle>
              <div className="flex gap-2 mt-2">
                <AddParticipant reviewId={params.reviewId} onSuccess={() => window.location.reload()} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {review.participants?.map((participant: any) => (
                <div key={participant.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{participant.user.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {participant.role === 'REVIEWER' ? '评审人' : participant.role === 'OBSERVER' ? '观察者' : '记录员'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteParticipant(participant.id)}
                    >
                      移除
                    </Button>
                  </div>
                ))}
              {(!review.participants || review.participants.length === 0) && (
                <div className="text-center text-muted-foreground py-4">
                    暂无参与者
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
