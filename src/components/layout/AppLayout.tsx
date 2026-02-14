"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

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
