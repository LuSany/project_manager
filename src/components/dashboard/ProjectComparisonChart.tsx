'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { EMPTY_PROJECT_MESSAGE } from '@/types/dashboard-charts'
import type { ProjectComparisonItem } from '@/types/dashboard-charts'

export function ProjectComparisonChart() {
  const [data, setData] = useState<ProjectComparisonItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/v1/dashboard/project-comparison', {
          credentials: 'include',
        })
        const result = await response.json()
        if (result.success) {
          setData(result.data.slice(0, 6))
        } else {
          setData([])
        }
      } catch (e) {
        console.error('获取项目对比数据失败:', e)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const isEmpty = !loading && data.length === 0

  return (
    <ChartCard
      icon={BarChart3}
      iconColor="text-emerald-500"
      title="项目完成率对比"
      loading={loading}
      empty={isEmpty}
      emptyMessage={EMPTY_PROJECT_MESSAGE}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="projectName"
            type="category"
            width={50}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, '完成率']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Bar dataKey="completionRate" barSize={16} radius={[0, 4, 4, 0]} fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
