'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RiskTaskLinkProps {
  riskId: string;
}

export function RiskTaskLink({ riskId }: RiskTaskLinkProps) {
  const [tasks, setTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRelatedTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/risks/${riskId}/tasks`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error('获取关联任务失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>关联任务</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center h-32">
            加载中...
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            暂无关联任务
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((taskId, index) => (
              <div key={taskId} className="flex items-center gap-3 p-2 border rounded">
                <div className="flex-1">
                  <span className="font-mono">{index + 1}.</span>
                  <div>
                    <p className="text-sm">{taskId}</p>
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
