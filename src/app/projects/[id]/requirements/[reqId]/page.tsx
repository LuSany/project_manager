"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export default function RequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const reqId = params?.reqId;
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRequirement = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/requirements/' + reqId);
      const data = await response.json();

      if (data.success) {
        setRequirement(data.data);
        setTitle(data.data.title);
        setDescription(data.data.description || "");
        setStatus(data.data.status);
        setPriority(data.data.priority);
      }
    } catch (error) {
      console.error("获取需求详情失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reqId) {
      fetchRequirement();
    }
  }, [reqId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/requirements/' + reqId, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, status, priority }),
      });

      const data = await response.json();

      if (data.success) {
        setRequirement(data.data);
        setEditing(false);
      }
    } catch (error) {
      console.error("更新需求失败:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个需求吗？")) {
      return;
    }

    try {
      const response = await fetch('/api/v1/requirements/' + reqId, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/projects/${id}/requirements`);
      }
    } catch (error) {
      console.error("删除需求失败:", error);
    }
  };

  const statusLabels: Record<string, string> = {
    PENDING: "待审批",
    APPROVED: "已批准",
    REJECTED: "已拒绝",
    IN_PROGRESS: "进行中",
    COMPLETED: "已完成",
  };

  const priorityLabels: Record<string, string> = {
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">需求不存在</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">需求详情</h1>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              ← 返回
            </button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>需求信息</CardTitle>
                <div className="flex items-center gap-2">
                  {!editing && (
                    <>
                      <Badge className={statusColors[requirement.status]}>
                        {statusLabels[requirement.status]}
                      </Badge>
                      <Badge className={priorityColors[requirement.priority]}>
                        {priorityLabels[requirement.priority]}
                      </Badge>
                    </>
                  )}
                  <Button
                    variant={editing ? "outline" : "default"}
                    onClick={() => {
                      if (editing) {
                        handleSave();
                      } else {
                        setEditing(true);
                      }
                    }}
                    disabled={saving}
                  >
                    {editing ? (saving ? "保存中..." : "保存") : "编辑"}
                  </Button>
                  {!editing && (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      删除
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      标题 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">描述</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 bg-background min-h-32"
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
                        <option value="PENDING">待审批</option>
                        <option value="APPROVED">已批准</option>
                        <option value="REJECTED">已拒绝</option>
                        <option value="IN_PROGRESS">进行中</option>
                        <option value="COMPLETED">已完成</option>
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
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{requirement.title}</h3>
                    {requirement.description && (
                      <p className="text-muted-foreground">{requirement.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">创建时间：</span>
                      {new Date(requirement.createdAt).toLocaleString("zh-CN")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">更新时间：</span>
                      {new Date(requirement.updatedAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
