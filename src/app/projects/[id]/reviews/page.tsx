'use client';

import { useEffect, useState } from 'react';
import { CreateReviewDialog } from '@/components/views/CreateReviewDialog';
import { MaterialUpload } from '@/components/views/MaterialUpload';
import { AddParticipant } from '@/components/views/AddParticipant';
import { ReviewItemForm } from '@/components/views/ReviewItemForm';
import { ReviewList } from '@/components/views/ReviewList';

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
  params: { id: string };
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/reviews?projectId=${params.id}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.data || []);
      }
    } catch (err) {
      console.error('获取评审列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [params.id]);

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">评审管理</h1>
        <div className="flex gap-2">
          <CreateReviewDialog projectId={params.id} onSuccess={fetchReviews} />
        </div>
      </div>

      <ReviewList reviews={reviews} onDelete={handleDelete} />
    </div>
  );
}
