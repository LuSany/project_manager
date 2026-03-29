'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { AlertCircle } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import {
  PriorityDistributionItem,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  EMPTY_STATE_MESSAGES,
} from '@/types/dashboard-charts'

export function PriorityDonut() {
  const [data, setData] = useState<PriorityDistributionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/stats', {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success && result.data.priorityDistribution) {
          setData(result.data.priorityDistribution)
        }
      } catch (e) {
        console.error('获取优先级分布失败:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <ChartCard
      title="优先级分布"
      icon={AlertCircle}
      iconColor="text-amber-500"
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
                <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
              ))}
              <Label value={total} position="center" fill="#333" fontSize={20} fontWeight="bold" />
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, PRIORITY_LABELS[name] || name]}
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
