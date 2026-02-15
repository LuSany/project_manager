'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  status: string;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  assignees: Array<{ id: string; name: string }>;
}

interface TaskTimelineProps {
  tasks: Task[];
}

export function TaskTimeline({ tasks }: TaskTimelineProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.startDate || a.dueDate || '';
    const dateB = b.startDate || b.dueDate || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-200 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-200 text-blue-800';
      case 'REVIEW':
        return 'bg-yellow-200 text-yellow-800';
      case 'TESTING':
        return 'bg-purple-200 text-purple-800';
      case 'DONE':
        return 'bg-green-200 text-green-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO':
        return '待办';
      case 'IN_PROGRESS':
        return '进行中';
      case 'REVIEW':
        return '待审核';
      case 'TESTING':
        return '测试中';
      case 'DONE':
        return '已完成';
      default:
        return status;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '未设置';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>任务时间线</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {sortedTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            暂无任务
          </div>
        ) : (
          <div className="space-y-6">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="relative pl-6 pb-6 border-l-2 border-muted"
              >
                <div className="absolute left-0 top-0 w-4 h-4 -translate-x-1/2 rounded-full bg-primary" />

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-base">{task.title}</h3>
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>开始: {formatDate(task.startDate)}</span>
                    <span>截止: {formatDate(task.dueDate)}</span>
                    {isOverdue(task) && (
                      <span className="text-red-600 font-medium">已逾期</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">
                        进度: {task.progress}%
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">执行人:</span>
                      {task.assignees.slice(0, 3).map((assignee) => (
                        <span
                          key={assignee.id}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {assignee.name}
                        </span>
                      ))}
                      {task.assignees.length > 3 && (
                        <span className="text-muted-foreground text-xs">
                          +{task.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
