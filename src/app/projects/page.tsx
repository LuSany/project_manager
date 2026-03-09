"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });

      const response = await fetch('/api/v1/projects?' + searchParams, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // 替换列表而不是追加，避免重复显示
        setProjects(data.data.items);
      }
    } catch (error) {
      console.error("获取项目列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个项目吗？")) {
      return;
    }

    try {
      const response = await fetch('/api/v1/projects/' + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("删除项目失败:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">项目</h1>
        <button
          onClick={() => router.push("/projects/new")}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          新建项目
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium mb-2 text-muted-foreground">暂无项目</p>
            <p className="text-sm text-muted-foreground">开始创建您的第一个项目</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-card border rounded-lg p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <span className={'px-2 py-1 rounded-full text-xs font-medium ' +
                  (project.status === "PLANNING" ? "bg-yellow-100 text-yellow-800" :
                  project.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                  project.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                  project.status === "CANCELED" ? "bg-gray-100 text-gray-800" :
                    "bg-gray-100 text-gray-800"
                  )}>
                  {project.status === "PLANNING" ? "计划中" : ""}
                  {project.status === "ACTIVE" ? "进行中" : ""}
                  {project.status === "COMPLETED" ? "已完成" : ""}
                  {project.status === "CANCELED" ? "已取消" : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link href={'/projects/' + project.id} className="text-primary hover:underline">
                  查看详情 →
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-destructive hover:underline text-sm"
                >
                  删除
                </button>
              </div>

              <div className="text-sm text-muted-foreground mt-2">
                创建于 {new Date(project.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
