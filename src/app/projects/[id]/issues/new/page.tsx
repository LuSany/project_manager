"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IssueForm } from "@/components/issues/IssueForm";
import { ArrowLeft, Home } from "lucide-react";

export default function NewIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  const handleSuccess = () => {
    router.push(`/projects/${projectId}/issues`);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push(`/projects/${projectId}/issues`);
    }
  };

  if (!projectId) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      {/* 返回导航 */}
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/projects/${projectId}/issues`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回问题列表
          </Button>
        </Link>
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            返回项目
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            工作台
          </Button>
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">新建问题</h1>
        <p className="text-muted-foreground">
          创建新的问题来追踪项目中的问题
        </p>
      </div>

      <IssueForm
        projectId={projectId}
        open={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
