"use client";

import { useState, useEffect } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MyTasks } from "@/components/dashboard/MyTasks";
import { RiskBoard } from "@/components/dashboard/RiskBoard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, FolderOpen } from "lucide-react";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  myTasksCount: number;
  highRisksCount: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    myTasksCount: 0,
    highRisksCount: 0,
  });

  const fetchStats = async () => {
    try {
      // 获取项目统计
      const statsResponse = await fetch("/api/v1/dashboard/stats");
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(prev => ({
          ...prev,
          totalProjects: statsData.data.totalProjects || 0,
          activeProjects: statsData.data.activeProjects || 0,
          completedProjects: statsData.data.completedProjects || 0,
        }));
      }
    } catch (err) {
      console.error("获取统计数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">工作台</h1>
        <p className="text-muted-foreground">
          欢迎回来，这是您的项目管理工作台
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总项目数</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              所有项目总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中项目</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              活跃项目
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成项目</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              已完成交付
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高风险</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <RiskBoard />
            </div>
            <p className="text-xs text-muted-foreground">
              需要关注
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 我的任务 */}
        <MyTasks />

        {/* 风险看板 */}
        <RiskBoard />
      </div>
    </div>
  );
}
