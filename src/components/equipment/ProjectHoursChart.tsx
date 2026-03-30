'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import type { ProjectHoursItem } from '@/types/equipment-stats'

interface ProjectHoursChartProps {
  month?: string
  loading?: boolean
}

function getBarColor(hours: number) {
  if (hours < 80) return '#22c55e'
  if (hours < 100) return '#f59e0b'
  return '#ef4444'
}

export function ProjectHoursChart({ month, loading: externalLoading }: ProjectHoursChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ProjectHoursItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const queryParams = month ? `?month=${month}` : ''
        const response = await fetch(`/api/v1/equipment/stats/project-hours${queryParams}`, {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success) {
          setData(result.data || [])
        }
      } catch (e) {
        console.error('获取项目机时统计失败:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [month])

  const loadingState = externalLoading ?? loading

  return (
    <ChartCard
      title="项目机时统计"
      icon={BarChart3}
      iconColor="text-blue-500"
      loading={loadingState}
      empty={!loadingState && data.length === 0}
      emptyMessage="暂无机时数据"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-slate-500"
            label={{ value: '小时', position: 'insideRight', offset: -5 }}
          />
          <YAxis
            type="category"
            dataKey="projectName"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-slate-500"
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [`${value} 小时`, '使用时长']}
          />
          <Bar dataKey="totalHours" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.totalHours)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
