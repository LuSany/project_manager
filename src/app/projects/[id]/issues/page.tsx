"use client";

import { IssueList } from "@/components/issues/IssueList";
import { Suspense } from "react";
import { use } from "react";

interface IssuesPageProps {
  params: Promise<{ id: string }>;
}

function IssuesPageContent({ params }: IssuesPageProps) {
  const { id } = use(params);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">问题管理</h1>
        <p className="text-muted-foreground">
          追踪和管理项目中的问题
        </p>
      </div>

      <IssueList projectId={id} />
    </div>
  );
}

export default function IssuesPage(props: IssuesPageProps) {
  return (
    <Suspense fallback={<div className="p-6">加载中...</div>}>
      <IssuesPageContent {...props} />
    </Suspense>
  );
}
