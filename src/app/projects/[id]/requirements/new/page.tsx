"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ProjectMember {
  userId: string;
  users: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function NewRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 新增字段
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimateHours, setEstimateHours] = useState<string>("");
  const [businessLine, setBusinessLine] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");

  // 项目成员列表（用于指派人选择）
  const [members, setMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    params.then(p => {
      setProjectId(p.id);
      fetchProjectMembers(p.id);
    });
  }, [params]);

  const fetchProjectMembers = async (pid: string) => {
    try {
      const response = await fetch(`/api/v1/projects/${pid}/members`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error("获取项目成员失败:", error);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

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

      // 新增字段
      if (assigneeId) payload.assigneeId = assigneeId;
      if (dueDate) payload.dueDate = dueDate;
      if (estimateHours) payload.estimateHours = parseFloat(estimateHours);
      if (businessLine) payload.businessLine = businessLine;
      if (tags.length > 0) payload.tags = tags;

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">新建需求</h1>
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground text-sm"
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

                {/* 新增字段：业务线 */}
                <div>
                  <label className="block text-sm font-medium mb-2">业务线</label>
                  <input
                    type="text"
                    value={businessLine}
                    onChange={(e) => setBusinessLine(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 bg-background"
                    placeholder="请输入业务线/产品线名称"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  {/* 新增字段：指派人 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">指派人</label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 bg-background"
                    >
                      <option value="">请选择指派人</option>
                      {members.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.users.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 新增字段：截止日期 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">截止日期</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 bg-background"
                    />
                  </div>

                  {/* 新增字段：预估工时 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">预估工时（小时）</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={estimateHours}
                      onChange={(e) => setEstimateHours(e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 bg-background"
                      placeholder="如：8、16、24"
                    />
                  </div>
                </div>

                {/* 新增字段：标签 */}
                <div>
                  <label className="block text-sm font-medium mb-2">标签</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="flex-1 border border-border rounded-md px-3 py-2 bg-background"
                      placeholder="输入标签后按回车添加"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      添加
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
  );
}