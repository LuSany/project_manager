"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, User, Calendar, Clock, Briefcase } from "lucide-react";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  // 新增字段
  assigneeId: string | null;
  reporterId: string | null;
  dueDate: string | null;
  estimateHours: number | null;
  actualHours: number | null;
  businessLine: string | null;
  tags: string[];
  assignee?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  reporter?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

interface ProjectMember {
  userId: string;
  users: {
    id: string;
    name: string;
    avatar: string | null;
  };
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

  // 新增字段
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimateHours, setEstimateHours] = useState<string>("");
  const [actualHours, setActualHours] = useState<string>("");
  const [businessLine, setBusinessLine] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");

  // 项目成员列表
  const [members, setMembers] = useState<ProjectMember[]>([]);

  const fetchProjectMembers = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/v1/projects/${id}/members`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error("获取项目成员失败:", error);
    }
  };

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
        // 新增字段
        setAssigneeId(data.data.assigneeId || "");
        setDueDate(data.data.dueDate ? data.data.dueDate.split("T")[0] : "");
        setEstimateHours(data.data.estimateHours?.toString() || "");
        setActualHours(data.data.actualHours?.toString() || "");
        setBusinessLine(data.data.businessLine || "");
        setTags(data.data.tags || []);
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
      fetchProjectMembers();
    }
  }, [reqId]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        title,
        description,
        status,
        priority,
        // 新增字段
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        estimateHours: estimateHours ? parseFloat(estimateHours) : null,
        actualHours: actualHours ? parseFloat(actualHours) : null,
        businessLine: businessLine || null,
        tags,
      };

      const response = await fetch('/api/v1/requirements/' + reqId, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">需求不存在</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">需求详情</h1>
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground text-sm"
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
                      {requirement.businessLine && (
                        <Badge variant="outline">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {requirement.businessLine}
                        </Badge>
                      )}
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

                  {/* 新增：业务线 */}
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

                  <div className="grid grid-cols-2 gap-4">
                    {/* 新增：指派人 */}
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

                    {/* 新增：截止日期 */}
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

                  <div className="grid grid-cols-2 gap-4">
                    {/* 新增：预估工时 */}
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

                    {/* 新增：实际工时 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">实际工时（小时）</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={actualHours}
                        onChange={(e) => setActualHours(e.target.value)}
                        className="w-full border border-border rounded-md px-3 py-2 bg-background"
                        placeholder="实际消耗工时"
                      />
                    </div>
                  </div>

                  {/* 新增：标签 */}
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
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{requirement.title}</h3>
                    {requirement.description && (
                      <p className="text-muted-foreground whitespace-pre-wrap">{requirement.description}</p>
                    )}
                  </div>

                  {/* 新增：信息展示 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 指派人 */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        指派人：{requirement.assignee?.name || "未指派"}
                      </span>
                    </div>

                    {/* 提出人 */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        提出人：{requirement.reporter?.name || "-"}
                      </span>
                    </div>

                    {/* 截止日期 */}
                    {requirement.dueDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          截止日期：{new Date(requirement.dueDate).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    )}

                    {/* 预估工时 */}
                    {requirement.estimateHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          预估工时：{requirement.estimateHours}h
                        </span>
                      </div>
                    )}

                    {/* 实际工时 */}
                    {requirement.actualHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          实际工时：{requirement.actualHours}h
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 标签 */}
                  {requirement.tags && requirement.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {requirement.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      创建时间：{new Date(requirement.createdAt).toLocaleString("zh-CN")}
                    </div>
                    <div>
                      更新时间：{new Date(requirement.updatedAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
    </div>
  );
}