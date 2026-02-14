"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: any = {
        title,
        projectId,
      };

      if (description) payload.description = description;
      if (status !== "TODO") payload.status = status;
      if (priority !== "MEDIUM") payload.priority = priority;
      if (startDate) payload.startDate = new Date(startDate).toISOString();
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();
      if (estimatedHours) payload.estimatedHours = parseFloat(estimatedHours);

      const response = await fetch('/api/v1/tasks', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/projects/${projectId}/tasks`);
      } else {
        setError(data.error || "创建任务失败");
      }
    } catch (error) {
      console.error("创建任务失败:", error);
      setError("创建任务失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">新建任务</h1>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              ← 返回
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                标题 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 bg-background"
                placeholder="请输入任务标题"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 bg-background min-h-32"
                placeholder="请输入任务描述"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">状态</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                >
                  <option value="TODO">待办</option>
                  <option value="IN_PROGRESS">进行中</option>
                  <option value="REVIEW">待审核</option>
                  <option value="TESTING">测试中</option>
                  <option value="DONE">已完成</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">优先级</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                >
                  <option value="LOW">低</option>
                  <option value="MEDIUM">中</option>
                  <option value="HIGH">高</option>
                  <option value="URGENT">紧急</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">截止日期</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">预估工时（小时）</label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 bg-background"
                placeholder="请输入预估工时"
                min="0"
                step="0.5"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading || !title}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "创建中..." : "创建任务"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="border border-border px-6 py-2 rounded-md hover:bg-muted"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
