"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MilestoneList } from "@/components/milestones/MilestoneList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

export default function MilestonesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/v1/projects");
      const data = await response.json();

      if (data.success && data.data.items) {
        setProjects(data.data.items);
        if (data.data.items.length > 0) {
          setSelectedProjectId(data.data.items[0].id);
        }
      }
    } catch (error) {
      console.error("获取项目列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">里程碑管理</h1>
          <p className="text-muted-foreground">管理项目里程碑，追踪项目进度</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">暂无项目，请先创建项目</p>
          <button
            onClick={() => router.push("/projects")}
            className="text-primary hover:underline"
          >
            前往项目页面
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">选择项目:</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectId && (
            <MilestoneList projectId={selectedProjectId} />
          )}
        </>
      )}
    </div>
  );
}
