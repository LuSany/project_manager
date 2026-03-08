"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function TaskDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const taskId = params?.taskId as string;

  return (
    <div className="p-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/projects/${id}/tasks`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回任务列表
          </Button>
        </Link>
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            返回项目
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">任务详情</h1>
      <div className="text-muted-foreground">项目ID: {id}</div>
      <div className="text-muted-foreground">任务ID: {taskId}</div>
    </div>
  );
}
