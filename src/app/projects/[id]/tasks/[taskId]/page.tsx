"use client";

import { useParams } from "next/navigation";

export default function TaskDetailPage() {
  const params = useParams();
  const {id: projectId, taskId} = params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">任务详情</h1>
      <div className="text-muted-foreground">项目ID: {projectId}</div>
      <div className="text-muted-foreground">任务ID: {taskId}</div>
    </div>
  );
}
