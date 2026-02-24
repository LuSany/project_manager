"use client";

import { useState, useEffect } from "react";
import { IssueList } from "@/components/issues/IssueList";
import { Suspense } from "react";

export default function GlobalIssuesPage() {
  return (
    <Suspense fallback={<div className="p-6">加载中...</div>}>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">问题管理</h1>
          <p className="text-muted-foreground">
            查看所有项目的问题
          </p>
        </div>

        <IssueList />
      </div>
    </Suspense>
  );
}
