"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, GripVertical, User, Calendar, Clock, Settings } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BoardColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  wipLimit: number | null;
  order: number;
}

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimateHours: number | null;
  businessLine: string | null;
  tags: string[];
  assignee?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

// 可排序卡片组件
function SortableCard({ requirement, projectId }: { requirement: Requirement; projectId: string }) {
  const router = useRouter();

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: requirement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 计算截止日期状态
  const getDueDateColor = (dueDate: string | null): string => {
    if (!dueDate) return "text-muted-foreground";
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "text-red-500";
    if (diffDays <= 3) return "text-orange-500";
    return "text-muted-foreground";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/projects/${projectId}/requirements/${requirement.id}`)}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 mb-2">{requirement.title}</h4>

          <div className="flex flex-wrap items-center gap-1 mb-2">
            <Badge className={priorityColors[requirement.priority]} variant="secondary">
              {requirement.priority === 'HIGH' ? '高' : requirement.priority === 'MEDIUM' ? '中' : '低'}
            </Badge>
            {requirement.businessLine && (
              <Badge variant="outline" className="text-xs">
                {requirement.businessLine}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {requirement.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{requirement.assignee.name}</span>
              </div>
            )}
            {requirement.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className={getDueDateColor(requirement.dueDate)}>
                  {new Date(requirement.dueDate).toLocaleDateString("zh-CN", { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            {requirement.estimateHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{requirement.estimateHours}h</span>
              </div>
            )}
          </div>

          {requirement.tags && requirement.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {requirement.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {requirement.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{requirement.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 看板列组件
function BoardColumnComponent({
  column,
  requirements,
  projectId,
}: {
  column: BoardColumn;
  requirements: Requirement[];
  projectId: string;
}) {
  return (
    <div className="flex-shrink-0 w-72 bg-muted/50 rounded-lg">
      <div className="p-3 border-b" style={{ borderTopColor: column.color, borderTopWidth: 3 }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {requirements.length}
              {column.wipLimit && ` / ${column.wipLimit}`}
            </Badge>
          </div>
        </div>
      </div>
      <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {requirements.map((req) => (
          <SortableCard key={req.id} requirement={req} projectId={projectId} />
        ))}
        {requirements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无需求
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequirementsBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");

  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // 并行获取看板配置和需求列表
      const [configRes, reqRes] = await Promise.all([
        fetch(`/api/v1/projects/${projectId}/board-config`),
        fetch(`/api/v1/requirements?projectId=${projectId}&pageSize=100`),
      ]);

      const configData = await configRes.json();
      const reqData = await reqRes.json();

      if (configData.success) {
        setColumns(configData.data.columns as BoardColumn[]);
      }

      if (reqData.success) {
        setRequirements(reqData.data.items);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragStart = (event: { active: { id: import('@dnd-kit/core').UniqueIdentifier } }) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const requirementId = active.id as string;
    const targetColumnId = over.id as string;

    // 找到目标列
    const targetColumn = columns.find((col) => col.id === targetColumnId);
    if (!targetColumn) return;

    // 找到需求
    const requirement = requirements.find((req) => req.id === requirementId);
    if (!requirement || requirement.status === targetColumn.status) return;

    // 乐观更新
    setRequirements((prev) =>
      prev.map((req) =>
        req.id === requirementId ? { ...req, status: targetColumn.status } : req
      )
    );

    // 调用 API 更新状态
    try {
      const response = await fetch(`/api/v1/requirements/${requirementId}/change-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: targetColumn.status,
          comment: "通过看板拖拽变更",
        }),
      });

      if (!response.ok) {
        // 回滚
        fetchData();
      }
    } catch (error) {
      console.error("更新状态失败:", error);
      fetchData();
    }
  };

  // 获取列的需求
  const getColumnRequirements = (status: string): Requirement[] => {
    return requirements.filter((req) => req.status === status);
  };

  // 获取正在拖拽的需求
  const activeRequirement = activeId
    ? requirements.find((req) => req.id === activeId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/requirements`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">需求看板</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/requirements/new`)}
          >
            <Plus className="h-4 w-4 mr-1" />
            新建需求
          </Button>
        </div>
      </div>

      {/* 看板 */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 pb-4">
            {columns.map((column) => (
              <BoardColumnComponent
                key={column.id}
                column={column}
                requirements={getColumnRequirements(column.status)}
                projectId={projectId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeRequirement ? (
              <div className="bg-card border rounded-lg p-3 shadow-lg w-64">
                <h4 className="font-medium text-sm">{activeRequirement.title}</h4>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}