"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { MilestoneCard } from "./MilestoneCard";
import { MilestoneForm } from "./MilestoneForm";
import type { Milestone } from "@/types/milestone";

interface MilestoneListProps {
  projectId: string;
}

export function MilestoneList({ projectId }: MilestoneListProps) {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>();

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/milestones`);
      const data = await response.json();

      if (data.success) {
        setMilestones(data.data);
      }
    } catch (error) {
      console.error("获取里程碑列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个里程碑吗？")) return;

    try {
      const response = await fetch(`/api/v1/milestones/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMilestones((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("删除里程碑失败:", error);
      alert("删除失败，请重试");
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormOpen(true);
  };

  const handleView = (id: string) => {
    router.push(`/milestones/${id}`);
  };

  const filteredMilestones = milestones.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索里程碑..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setEditingMilestone(undefined);
          setFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          创建里程碑
        </Button>
      </div>

      {/* 里程碑列表 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : filteredMilestones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "没有找到匹配的里程碑" : "暂无里程碑，点击上方按钮创建"}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* 创建/编辑表单 */}
      <MilestoneForm
        projectId={projectId}
        milestone={editingMilestone}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingMilestone(undefined);
        }}
        onSuccess={fetchMilestones}
      />
    </div>
  );
}
