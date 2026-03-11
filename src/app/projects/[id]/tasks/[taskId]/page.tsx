"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, Trash2, TrendingUp } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  projectId: string;
  milestoneId?: string | null;
  project: {
    id: string;
    name: string;
  };
  milestone?: {
    id: string;
    title: string;
  } | null;
  assignees: Array<{
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  subTasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  userId: string;
  userName: string;
  userEmail: string;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface ProgressHistory {
  id: string;
  progress: number;
  status: string | null;
  comment: string | null;
  previousProgress: number | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  TODO: "待办",
  IN_PROGRESS: "进行中",
  REVIEW: "待审核",
  TESTING: "测试中",
  DONE: "已完成",
  CANCELLED: "已取消",
  DELAYED: "延期",
  BLOCKED: "阻塞",
};

const priorityLabels: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "紧急",
};

const statusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  REVIEW: "bg-yellow-100 text-yellow-800",
  TESTING: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  DELAYED: "bg-orange-100 text-orange-800",
  BLOCKED: "bg-red-200 text-red-900",
};

export default function TaskDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const taskId = params?.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [newProgress, setNewProgress] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showProgressForm, setShowProgressForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    progress: 0,
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    assigneeIds: [] as string[],
    milestoneId: "",
  });

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchMembers();
      fetchMilestones();
      fetchProgressHistory();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
        setSubTasks(data.data.subTasks || []);
        setFormData({
          title: data.data.title,
          description: data.data.description || "",
          status: data.data.status,
          progress: data.data.progress,
          priority: data.data.priority,
          startDate: data.data.startDate ? data.data.startDate.split("T")[0] : "",
          dueDate: data.data.dueDate ? data.data.dueDate.split("T")[0] : "",
          estimatedHours: data.data.estimatedHours?.toString() || "",
          actualHours: data.data.actualHours?.toString() || "",
          assigneeIds: data.data.assignees?.length > 0 ? [data.data.assignees[0].userId] : [],
          milestoneId: data.data.milestoneId || "",
        });
      }
    } catch (error) {
      console.error("获取任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/members`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error("获取成员失败:", error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/milestones`);
      const data = await response.json();
      if (data.success) {
        setMilestones(data.data || []);
      }
    } catch (error) {
      console.error("获取里程碑失败:", error);
    }
  };

  const fetchProgressHistory = async () => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/progress-history`);
      const data = await response.json();
      if (data.success) {
        setProgressHistory(data.data || []);
      }
    } catch (error) {
      console.error("获取进展历史失败:", error);
    }
  };

  const handleAddProgress = async () => {
    if (!newProgress) return;

    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/progress-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: parseInt(newProgress),
          comment: newComment || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setProgressHistory([data.data, ...progressHistory]);
        setNewProgress("");
        setNewComment("");
        setShowProgressForm(false);
        fetchTask(); // 刷新任务数据
      }
    } catch (error) {
      console.error("添加进展记录失败:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          progress: Number(formData.progress),
          priority: formData.priority,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
          estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : null,
          actualHours: formData.actualHours ? Number(formData.actualHours) : null,
          milestoneId: formData.milestoneId || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("保存成功");
        fetchTask();
      } else {
        alert("保存失败: " + (data.error?.message || data.error || "未知错误"));
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim()) return;

    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubTaskTitle }),
      });
      const data = await response.json();
      if (data.success) {
        setSubTasks(data.data || []);
        setNewSubTaskTitle("");
      }
    } catch (error) {
      console.error("添加子任务失败:", error);
    }
  };

  const handleToggleSubTask = async (subTaskId: string, completed: boolean) => {
    try {
      await fetch(`/api/v1/tasks/${taskId}/subtasks/${subTaskId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      fetchTask();
    } catch (error) {
      console.error("切换子任务状态失败:", error);
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
    if (!confirm("确定要删除此子任务吗？")) return;

    try {
      await fetch(`/api/v1/tasks/${taskId}/subtasks/${subTaskId}`, {
        method: "DELETE",
      });
      fetchTask();
    } catch (error) {
      console.error("删除子任务失败:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">任务不存在</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 返回导航 */}
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/projects/${projectId}/tasks`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回任务列表
          </Button>
        </Link>
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            返回项目
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            工作台
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-muted-foreground">
            项目: {task.project?.name} | 创建于 {new Date(task.createdAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              保存
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">待办</SelectItem>
                    <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                    <SelectItem value="REVIEW">待审核</SelectItem>
                    <SelectItem value="TESTING">测试中</SelectItem>
                    <SelectItem value="DONE">已完成</SelectItem>
                    <SelectItem value="CANCELLED">已取消</SelectItem>
                    <SelectItem value="DELAYED">延期</SelectItem>
                    <SelectItem value="BLOCKED">阻塞</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">低</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                    <SelectItem value="CRITICAL">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestone">关联里程碑</Label>
              <Select
                value={formData.milestoneId}
                onValueChange={(value) => setFormData({ ...formData, milestoneId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择里程碑（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无</SelectItem>
                  {milestones.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 进度和时间 */}
        <Card>
          <CardHeader>
            <CardTitle>进度和时间</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progress">进度 (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${formData.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">截止日期</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">预估工时 (小时)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualHours">实际工时 (小时)</Label>
                <Input
                  id="actualHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.actualHours}
                  onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 子任务 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>子任务</span>
              <Badge variant="outline">
                {subTasks.filter(s => s.completed).length}/{subTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 添加子任务 */}
            <div className="flex gap-2">
              <Input
                placeholder="添加子任务..."
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubTask()}
              />
              <Button size="sm" onClick={handleAddSubTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 子任务列表 */}
            {subTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无子任务</p>
            ) : (
              <div className="space-y-2">
                {subTasks.map((subTask) => (
                  <div
                    key={subTask.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subTask.completed}
                        onChange={() => handleToggleSubTask(subTask.id, subTask.completed)}
                        className="h-4 w-4"
                      />
                      <span className={subTask.completed ? "line-through text-muted-foreground" : ""}>
                        {subTask.title}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubTask(subTask.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 负责人 */}
        <Card>
          <CardHeader>
            <CardTitle>负责人</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground">暂无项目成员</p>
            ) : (
              <Combobox
                options={members.map((member) => ({
                  value: member.userId,
                  label: `${member.userName} (${member.userEmail})`,
                }))}
                value={formData.assigneeIds[0] || ""}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    assigneeIds: [value],
                  }));
                }}
                placeholder="选择负责人"
                emptyText="无匹配成员"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 更新历史 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              进展记录
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProgressForm(!showProgressForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加进展
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 添加进展表单 */}
          {showProgressForm && (
            <div className="mb-4 p-4 border rounded-lg bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newProgress">进度 (%)</Label>
                  <Input
                    id="newProgress"
                    type="number"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(e.target.value)}
                    placeholder="输入进度百分比"
                  />
                </div>
                <div>
                  <Label htmlFor="newComment">说明</Label>
                  <Input
                    id="newComment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="进展说明（可选）"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddProgress} disabled={!newProgress}>
                  保存进展
                </Button>
                <Button variant="outline" onClick={() => setShowProgressForm(false)}>
                  取消
                </Button>
              </div>
            </div>
          )}

          {/* 进展历史列表 */}
          <div className="space-y-3">
            {progressHistory.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                暂无进展记录
              </div>
            ) : (
              progressHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600">
                        {record.previousProgress !== null
                          ? `${record.previousProgress}% → ${record.progress}%`
                          : `${record.progress}%`}
                      </span>
                      {record.status && (
                        <Badge variant="outline">{statusLabels[record.status] || record.status}</Badge>
                      )}
                    </div>
                    {record.comment && (
                      <p className="text-sm text-muted-foreground mt-1">{record.comment}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {record.user.name} · {new Date(record.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* 任务创建记录 */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">任务创建</div>
                <div className="text-muted-foreground">
                  {new Date(task.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}