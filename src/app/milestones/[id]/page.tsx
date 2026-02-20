"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Edit, CheckCircle2, Clock } from "lucide-react";
import type { Milestone } from "@/types/milestone";
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_COLORS } from "@/types/milestone";

export default function MilestoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setMilestoneId(p.id));
  }, [params]);

  useEffect(() => {
    if (milestoneId) {
      fetchMilestone();
    }
  }, [milestoneId]);

  const fetchMilestone = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/milestones/${milestoneId}`);
      const data = await response.json();

      if (data.success) {
        setMilestone(data.data);
      }
    } catch (error) {
      console.error("获取里程碑详情失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  if (!milestone) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">里程碑不存在</p>
        <Button variant="link" onClick={() => router.back()}>
          返回
        </Button>
      </div>
    );
  }

  const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== "COMPLETED";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{milestone.title}</h1>
          {milestone.project && (
            <p className="text-muted-foreground">项目: {milestone.project.name}</p>
          )}
        </div>
        <Badge className={MILESTONE_STATUS_COLORS[milestone.status]}>
          {MILESTONE_STATUS_LABELS[milestone.status]}
        </Badge>
      </div>

      {/* 基本信息 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestone.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">描述</p>
                <p>{milestone.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">截止日期</p>
                <p className={isOverdue ? "text-destructive font-medium" : ""}>
                  {milestone.dueDate
                    ? new Date(milestone.dueDate).toLocaleDateString("zh-CN")
                    : "未设置"}
                  {isOverdue && " (已逾期)"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">进度</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">{milestone.progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>任务统计</CardTitle>
          </CardHeader>
          <CardContent>
            {milestone.tasks && milestone.tasks.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">总任务数</span>
                  <span className="font-medium">{milestone.tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">已完成</span>
                  <span className="font-medium text-green-600">
                    {milestone.tasks.filter(t => t.status === "DONE").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">进行中</span>
                  <span className="font-medium text-blue-600">
                    {milestone.tasks.filter(t => t.status === "IN_PROGRESS").length}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">暂无关联任务</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 关联任务列表 */}
      {milestone.tasks && milestone.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>关联任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {milestone.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">进度: {task.progress}%</p>
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
