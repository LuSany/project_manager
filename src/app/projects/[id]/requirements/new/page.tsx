"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

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
      if (priority !== "MEDIUM") payload.priority = priority;

      const response = await fetch('/api/v1/requirements', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/projects/${projectId}/requirements`);
      } else {
        setError(data.error || "创建需求失败");
      }
    } catch (error) {
      console.error("创建需求失败:", error);
      setError("创建需求失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">新建需求</h1>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              ← 返回
            </button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>需求信息</CardTitle>
            </CardHeader>
            <CardContent>
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
                    placeholder="请输入需求标题"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">描述</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 bg-background min-h-32"
                    placeholder="请输入需求描述"
                  />
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
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={loading || !title}
                  >
                    {loading ? "创建中..." : "创建需求"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
