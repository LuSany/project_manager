'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { AlertCircle } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/types/dashboard-charts'
import type { TaskPriority } from '@prisma/client'

interface DistributionItem {
  name: string
  value: number
}

function PriorityDonutInner() {
  const [data, setData] = useState<DistributionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/v1/dashboard/stats', {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success && result.data?.priorityDistribution) {
          setData(result.data.priorityDistribution)
        } else {
          setData([])
        }
      } catch (e) {
        console.error('获取优先级分布数据失败:', e)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const isEmpty = !loading && data.length === 0

  return (
    <ChartCard
      icon={AlertCircle}
      iconColor="text-amber-500"
      title="优先级分布"
      loading={loading}
      empty={isEmpty}
      emptyMessage="暂无数据"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={PRIORITY_COLORS[entry.name as TaskPriority] || '#6b7280'}
                name={entry.name}
              />
            ))}
            <Label value={total} position="center" />
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number, name: string) => [
              `${value} 个任务`,
              PRIORITY_LABELS[name as TaskPriority] || name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: PRIORITY_COLORS[entry.name as TaskPriority] || '#6b7280',
              }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {PRIORITY_LABELS[entry.name as TaskPriority] || entry.name}
            </span>
            <span className="ml-1 text-xs text-slate-500 dark:text-slate-500">
              ({((entry.value / (total || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

import dynamic from 'next/dynamic'
import { ChartSkeleton } from '@/components/dashboard/ChartSkeleton'

export const PriorityDonut = dynamic(() => Promise.resolve(PriorityDonutInner), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})
