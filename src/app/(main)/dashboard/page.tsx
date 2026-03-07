'use client'

import { useState, useEffect } from 'react'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { StatsGrid } from '@/components/dashboard/MetricCard'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { TaskBoard } from '@/components/dashboard/TaskBoard'
import { RiskOverview } from '@/components/dashboard/RiskOverview'
import { QuickActions } from '@/components/dashboard/QuickActions'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  myTasksCount: number
  highRisksCount: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    myTasksCount: 0,
    highRisksCount: 0,
  })

  const fetchStats = async () => {
    try {
      const statsResponse = await fetch('/api/v1/dashboard/stats')
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats({
          totalProjects: statsData.data.totalProjects || 0,
          activeProjects: statsData.data.activeProjects || 0,
          completedProjects: statsData.data.completedProjects || 0,
          myTasksCount: statsData.data.myTasksCount || 0,
          highRisksCount: statsData.data.highRisksCount || 0,
        })
      }
    } catch (err) {
      console.error('获取统计数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 pb-8">
      {/* 欢迎区域 */}
      <WelcomeSection />

      {/* 统计卡片 */}
      <StatsGrid loading={loading} />

      {/* 活动趋势图 */}
      <ActivityChart />

      {/* 主要内容区域 - 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：任务看板 */}
        <TaskBoard />

        {/* 右侧：风险概览 */}
        <RiskOverview />
      </div>

      {/* 快捷入口 */}
      <QuickActions />
    </div>
  )
}