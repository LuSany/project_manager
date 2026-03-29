'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flag } from 'lucide-react'
import { format } from 'date-fns'
import { ChartCard } from '@/components/dashboard/ChartCard'
import {
  MilestoneProgressItem,
  MILESTONE_STATUS_COLORS,
  MILESTONE_DOT_COLORS,
  EMPTY_MILESTONE_MESSAGE,
} from '@/types/dashboard-charts'

export function MilestoneProgressList() {
  const [data, setData] = useState<MilestoneProgressItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/v1/dashboard/progress', {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success && result.data?.milestones) {
          setData(result.data.milestones.slice(0, 6))
        } else {
          setData([])
        }
      } catch (e) {
        console.error('获取里程碑进度失败:', e)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDueDate = (date: string | null) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'MM/dd')
    } catch {
      return '-'
    }
  }

  const isEmpty = !loading && data.length === 0

  return (
    <ChartCard
      icon={Flag}
      iconColor="text-violet-500"
      title="里程碑进度"
      loading={loading}
      empty={isEmpty}
      emptyMessage={EMPTY_MILESTONE_MESSAGE}
    >
      <div className="flex h-full flex-col gap-1 overflow-y-auto pr-2">
        {data.map((item) => (
          <div
            key={item.milestoneId}
            className="border-border/40 flex items-center gap-3 border-b py-2 last:border-0"
          >
            <div
              data-testid="status-dot"
              data-status={item.status}
              className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                MILESTONE_DOT_COLORS[item.status] || 'bg-slate-400'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              {item.projectName && (
                <p className="text-muted-foreground truncate text-xs">{item.projectName}</p>
              )}
              <div className="relative mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <motion.div
                  className={`absolute h-full rounded-full ${
                    MILESTONE_STATUS_COLORS[item.status] || 'bg-slate-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-medium">{item.progress}%</span>
            </div>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {formatDueDate(item.dueDate)}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
