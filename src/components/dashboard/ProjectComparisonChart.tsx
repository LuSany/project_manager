'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { ProjectComparisonItem, EMPTY_STATE_MESSAGES } from '@/types/dashboard-charts'

export function ProjectComparisonChart() {
  const [data, setData] = useState<ProjectComparisonItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/project-comparison', {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success) {
          setData(result.data.slice(0, 6))
        }
      } catch (e) {
        console.error('获取项目对比数据失败:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <ChartCard
      title="项目完成率对比"
      icon={BarChart3}
      iconColor="text-emerald-500"
      loading={loading}
      empty={!loading && data.length === 0}
      emptyMessage={EMPTY_STATE_MESSAGES.projects}
    >
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
            <Tooltip
              formatter={(value: number) => [`${value}%`, '完成率']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="completionRate" fill="#10b981" barSize={16} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.completionRate >= 80
                      ? '#22c55e'
                      : entry.completionRate >= 50
                        ? '#10b981'
                        : '#f59e0b'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
