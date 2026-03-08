"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { RiskCard } from "./RiskCard";
import { RiskForm } from "./RiskForm";
import type { Risk, RiskLevel, RiskStatus, RiskCategory } from "@/types/risk";
import { RISK_LEVEL_LABELS, RISK_STATUS_LABELS, RISK_CATEGORY_LABELS } from "@/types/risk";

interface RiskListProps {
  projectId: string;
}

export function RiskList({ projectId }: RiskListProps) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<RiskLevel | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<RiskStatus | "ALL">("ALL");
  const [filterCategory, setFilterCategory] = useState<RiskCategory | "ALL">("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>();

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/risks`);
      const data = await response.json();

      if (data.success) {
        setRisks(data.data);
      }
    } catch (error) {
      console.error("获取风险列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [projectId]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个风险吗？")) return;

    try {
      const response = await fetch(`/api/v1/risks/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setRisks((prev) => prev.filter((r) => r.id !== id));
      } else {
        // 处理错误对象
        let errorMsg = "删除失败";
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (data.error && typeof data.error === 'object' && 'message' in data.error) {
          errorMsg = (data.error as { message: string }).message;
        }
        alert(errorMsg);
      }
    } catch (error) {
      console.error("删除风险失败:", error);
      alert("删除失败，请重试");
    }
  };

  const handleEdit = (risk: Risk) => {
    setEditingRisk(risk);
    setFormOpen(true);
  };

  // 过滤风险
  const filteredRisks = risks.filter((risk) => {
    // 搜索过滤
    const matchesSearch =
      risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (risk.description && risk.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // 风险等级过滤
    const matchesLevel = filterLevel === "ALL" || risk.riskLevel === filterLevel;

    // 状态过滤
    const matchesStatus = filterStatus === "ALL" || risk.status === filterStatus;

    // 类别过滤
    const matchesCategory = filterCategory === "ALL" || risk.category === filterCategory;

    return matchesSearch && matchesLevel && matchesStatus && matchesCategory;
  });

  // 按风险等级排序（高风险优先）
  const sortedRisks = [...filteredRisks].sort((a, b) => {
    const levelOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
  });

  const clearFilters = () => {
    setFilterLevel("ALL");
    setFilterStatus("ALL");
    setFilterCategory("ALL");
    setSearchQuery("");
  };

  const hasActiveFilters = filterLevel !== "ALL" || filterStatus !== "ALL" || filterCategory !== "ALL" || searchQuery !== "";

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索风险..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setEditingRisk(undefined);
          setFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          创建风险
        </Button>
      </div>

      {/* 过滤器 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">筛选：</span>
        </div>

        <Select
          value={filterLevel}
          onValueChange={(value) => setFilterLevel(value as RiskLevel | "ALL")}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="风险等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部等级</SelectItem>
            {(Object.keys(RISK_LEVEL_LABELS) as RiskLevel[]).map((level) => (
              <SelectItem key={level} value={level}>
                {RISK_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as RiskStatus | "ALL")}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部状态</SelectItem>
            {(Object.keys(RISK_STATUS_LABELS) as RiskStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {RISK_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterCategory}
          onValueChange={(value) => setFilterCategory(value as RiskCategory | "ALL")}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="类别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部类别</SelectItem>
            {(Object.keys(RISK_CATEGORY_LABELS) as RiskCategory[]).map((category) => (
              <SelectItem key={category} value={category}>
                {RISK_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            清除筛选
          </Button>
        )}
      </div>

      {/* 风险列表 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : sortedRisks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {hasActiveFilters ? "没有找到匹配的风险" : "暂无风险，点击上方按钮创建"}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedRisks.map((risk) => (
            <RiskCard
              key={risk.id}
              risk={risk}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 创建/编辑表单 */}
      <RiskForm
        projectId={projectId}
        risk={editingRisk}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRisk(undefined);
        }}
        onSuccess={fetchRisks}
      />
    </div>
  );
}
