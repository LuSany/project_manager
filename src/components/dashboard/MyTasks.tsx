'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: Date;
  milestoneId?: string;
}

export function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/dashboard/my-tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error('获取我的任务失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">紧急</Badge>;
      case 'HIGH':
        return <Badge variant="default">高</Badge>;
      case 'MEDIUM':
        return <Badge variant="secondary">中</Badge>;
      default:
        return <Badge variant="outline">低</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的任务</CardTitle>
        <Link href="/tasks/new">
          <Button size="sm">新建任务</Button>
        </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div>加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            暂无任务
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task: Task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.projectId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      截止: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '未设置'}
                    </p>
                  </div>
                  <div className="flex-1 ml-auto">
                    {getPriorityBadge(task.priority)}
                    {task.status !== 'DONE' && (
                      <Button variant="ghost" size="sm">标记完成</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
