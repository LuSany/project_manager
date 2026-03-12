'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReviewWizard } from '@/components/reviews/ReviewWizard';
import { ReviewList } from '@/components/views/ReviewList';
import { ArrowLeft, Plus } from 'lucide-react';

interface Review {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduledAt?: string;
  type: {
    id: string;
    displayName: string;
  };
  materials: Array<{
    fileName: string;
    fileSize: number;
  }>;
  participants: Array<{
    user: {
      name: string;
      email: string;
    };
  }>;
  _count: {
    materials: number;
    participants: number;
    items: number;
  };
}

export default function ReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/reviews?projectId=${id}`);
      const data = await response.json();
      if (data.success) {
        setReviews(Array.isArray(data.data?.data) ? data.data.data : []);
      }
    } catch (err) {
      console.error('获取评审列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const handleDelete = async (review: Review) => {
    if (!confirm(`确定要删除评审"${review.title}"吗？`)) return;

    try {
      const response = await fetch(`/api/v1/reviews/${review.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchReviews();
      }
    } catch (err) {
      console.error('删除评审失败:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回项目
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">评审管理</h1>
        <div className="flex gap-2">
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建评审
          </Button>
          <ReviewWizard
            projectId={id}
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onSuccess={fetchReviews}
          />
        </div>
      </div>

      <ReviewList reviews={reviews} projectId={id} onDelete={handleDelete} />
    </div>
  );
}
