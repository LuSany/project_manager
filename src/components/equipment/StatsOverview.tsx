'use client'

import { useEffect, useState } from 'react'
import { Monitor, Clock, TrendingUp, FileCheck, LucideIcon } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'
import type { StatsOverview as StatsOverviewType } from '@/types/equipment-stats'

interface StatsOverviewProps {
  loading?: boolean
}

const mockStats: StatsOverviewType = {
  totalBookings: 0,
  totalHours: 0,
  activeDevices: 0,
  totalDevices: 0,
}

export function StatsOverview({ loading: externalLoading }: StatsOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsOverviewType>(mockStats)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/equipment/stats', {
          credentials: 'include',
        })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (data.success) {
          setStats(data.data || mockStats)
        }
      } catch (e) {
        console.error('获取设备统计概览失败:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const avgUtilization =
    stats.totalDevices > 0 ? Math.round((stats.activeDevices / stats.totalDevices) * 100) : 0

  const metrics: Array<{
    title: string
    icon: LucideIcon
    value: number
    change?: number
    changeLabel?: string
    color: 'blue' | 'green' | 'amber' | 'red'
  }> = [
    {
      title: '总设备数',
      icon: Monitor,
      value: stats.totalDevices,
      change: 0,
      changeLabel: '较上月',
      color: 'blue',
    },
    {
      title: '本月使用小时',
      icon: Clock,
      value: Math.round(stats.totalHours * 10) / 10,
      change: 12,
      changeLabel: '较上月',
      color: 'green',
    },
    {
      title: '平均利用率',
      icon: TrendingUp,
      value: avgUtilization,
      change: 5,
      changeLabel: '较上月',
      color: 'amber',
    },
    {
      title: '本月预定数',
      icon: FileCheck,
      value: stats.totalBookings,
      change: 8,
      changeLabel: '较上月',
      color: 'blue',
    },
  ]

  const isLoading = externalLoading ?? loading

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {isLoading
        ? [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          ))
        : metrics.map((metric) => (
            <motion.div key={metric.title} variants={staggerItem}>
              <MetricCard
                title={metric.title}
                icon={metric.icon}
                value={metric.value}
                change={metric.change}
                changeLabel={metric.changeLabel}
                color={metric.color}
              />
            </motion.div>
          ))}
    </motion.div>
  )
}
