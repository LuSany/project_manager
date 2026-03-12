'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface ReviewListProps {
  reviews: Review[];
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  projectId: string;
}
export function ReviewList({ reviews, projectId, onEdit, onDelete }: ReviewListProps) {
  const router = useRouter();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">待评审</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="default">评审中</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">已完成</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>评审列表</CardTitle>
        <CardDescription>共 {reviews.length} 个评审</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>计划时间</TableHead>
              <TableHead>材料</TableHead>
              <TableHead>参与者</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow
                key={review.id}
                className="cursor-pointer hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/projects/${projectId}/reviews/${review.id}`);
                }}
              >
                <TableCell className="font-medium">{review.title}</TableCell>
                <TableCell>{review.type.displayName}</TableCell>
                <TableCell>{getStatusBadge(review.status)}</TableCell>
                <TableCell>
                  {review.scheduledAt
                    ? format(new Date(review.scheduledAt), 'yyyy-MM-dd HH:mm')
                    : '-'}
                </TableCell>
                <TableCell>{review._count.materials || 0}</TableCell>
                <TableCell>{review._count.participants || 0}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(review)}
                      >
                        编辑
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(review)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
