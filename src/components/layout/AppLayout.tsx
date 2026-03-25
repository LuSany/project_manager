"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";

export interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // 从 store 获取折叠状态
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 等待加载完成后检查登录状态
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // 加载中显示加载状态
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录时不渲染内容（等待重定向）
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 - 从 store 读取状态 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div
        className={`
          flex-1 flex-col overflow-hidden
          transition-all duration-300
          ${sidebarCollapsed ? "ml-16" : "ml-64"}
        `}
      >
        {/* 顶栏 */}
        <Header />

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
