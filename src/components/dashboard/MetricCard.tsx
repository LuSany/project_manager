'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricData {
  value: number
  change?: number
  changeLabel?: string
}

interface MetricCardProps {
  title: string
  icon: LucideIcon
  value: number
  change?: number
  changeLabel?: string
  color: 'blue' | 'green' | 'amber' | 'red'
  loading?: boolean
}

const colorConfig = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconText: 'text-blue-600 dark:text-blue-400',
    valueText: 'text-blue-700 dark:text-blue-300',
    border: 'hover:border-blue-200 dark:hover:border-blue-800'
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    valueText: 'text-emerald-700 dark:text-emerald-300',
    border: 'hover:border-emerald-200 dark:hover:border-emerald-800'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconText: 'text-amber-600 dark:text-amber-400',
    valueText: 'text-amber-700 dark:text-amber-300',
    border: 'hover:border-amber-200 dark:hover:border-amber-800'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconText: 'text-red-600 dark:text-red-400',
    valueText: 'text-red-700 dark:text-red-300',
    border: 'hover:border-red-200 dark:hover:border-red-800'
  }
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const startValue = useRef(0)

  useEffect(() => {
    startValue.current = displayValue
    startTime.current = null

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / duration, 1)

      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.round(startValue.current + (value - startValue.current) * eased)

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{displayValue.toLocaleString()}</span>
}

export function MetricCard({
  title,
  icon: Icon,
  value,
  change,
  changeLabel,
  color,
  loading
}: MetricCardProps) {
  const colors = colorConfig[color]

  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-slate-500'
    // 对于风险等指标，下降可能是好事
    if (color === 'red' || color === 'amber') {
      return change < 0 ? 'text-green-500' : 'text-red-500'
    }
    return change > 0 ? 'text-green-500' : 'text-red-500'
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200 border-transparent',
        colors.bg,
        colors.border
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              <p className={cn('text-3xl font-bold', colors.valueText)}>
                <AnimatedNumber value={value} />
              </p>
            )}
            {change !== undefined && !loading && (
              <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {change > 0 ? '+' : ''}
                  {change}% {changeLabel || '较上周'}
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colors.iconBg)}>
            <Icon className={cn('h-6 w-6', colors.iconText)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 统计卡片组组件
interface StatsGridProps {
  loading?: boolean
}

export function StatsGrid({ loading }: StatsGridProps) {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    highRisks: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/stats', {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.success) {
          setStats({
            totalProjects: data.data.totalProjects || 0,
            activeProjects: data.data.activeProjects || 0,
            completedTasks: data.data.myTasksCount || 0,
            highRisks: data.data.highRisksCount || 0
          })
        }
      } catch (e) {
        console.error('获取统计失败:', e)
      }
    }

    fetchStats()
  }, [])

  const metrics: MetricCardProps[] = [
    {
      title: '项目总数',
      icon: FolderOpen,
      value: stats.totalProjects,
      change: 12,
      color: 'blue',
      loading
    },
    {
      title: '进行中项目',
      icon: Clock,
      value: stats.activeProjects,
      change: 5,
      color: 'amber',
      loading
    },
    {
      title: '已完成任务',
      icon: CheckCircle2,
      value: stats.completedTasks,
      change: 23,
      changeLabel: '本周',
      color: 'green',
      loading
    },
    {
      title: '高风险项',
      icon: AlertTriangle,
      value: stats.highRisks,
      change: -8,
      color: 'red',
      loading
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  )
}