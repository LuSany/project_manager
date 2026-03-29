'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import {
  TaskStatusDistributionItem,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  EMPTY_STATE_MESSAGES,
} from '@/types/dashboard-charts'

export function TaskStatusDonut() {
  const [data, setData] = useState<TaskStatusDistributionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/stats', {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success && result.data.taskStatusDistribution) {
          setData(result.data.taskStatusDistribution)
        }
      } catch (e) {
        console.error('获取任务状态分布失败:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <ChartCard
      title="任务状态分布"
      icon={PieChartIcon}
      iconColor="text-blue-500"
      loading={loading}
      empty={!loading && data.length === 0}
      emptyMessage={EMPTY_STATE_MESSAGES.tasks}
    >
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={TASK_STATUS_COLORS[entry.name] || '#6b7280'} />
              ))}
              <Label value={total} position="center" fill="#333" fontSize={20} fontWeight="bold" />
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, TASK_STATUS_LABELS[name] || name]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
