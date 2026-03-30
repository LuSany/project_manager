'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Activity } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import type { DeviceUtilizationItem } from '@/types/equipment-stats'

interface DeviceUtilizationChartProps {
  startDate?: string
  endDate?: string
  loading?: boolean
}

function getUtilizationColor(utilization: number) {
  if (utilization < 50) return '#22c55e'
  if (utilization < 80) return '#f59e0b'
  return '#ef4444'
}

export function DeviceUtilizationChart({
  startDate,
  endDate,
  loading: externalLoading,
}: DeviceUtilizationChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DeviceUtilizationItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        const queryString = params.toString()
        const response = await fetch(
          `/api/v1/equipment/stats/device-utilization${queryString ? `?${queryString}` : ''}`,
          {
            credentials: 'include',
          }
        )
        const result = await response.json()
        if (result.success) {
          setData(result.data || [])
        }
      } catch (e) {
        console.error('获取设备使用率统计失败:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate])

  const loadingState = externalLoading ?? loading

  const chartData = data.length > 0 ? data[0]?.dailyTrend || [] : []

  return (
    <ChartCard
      title="设备使用率趋势"
      icon={Activity}
      iconColor="text-emerald-500"
      loading={loadingState}
      empty={!loadingState && data.length === 0}
      emptyMessage="暂无使用率数据"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-slate-500"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-slate-500"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
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
          <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="3 3" />
          <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

interface DeviceUtilizationListProps {
  data: DeviceUtilizationItem[]
  loading?: boolean
}

export function DeviceUtilizationList({ data, loading: listLoading }: DeviceUtilizationListProps) {
  if (listLoading || data.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">设备详情</h4>
      <div className="space-y-2">
        {data.map((device) => (
          <div key={device.deviceId} className="flex items-center gap-3">
            <span className="w-24 truncate text-sm">{device.deviceName}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${device.utilization}%`,
                  backgroundColor: getUtilizationColor(device.utilization),
                }}
              />
            </div>
            <span className="w-12 text-right text-sm text-slate-500">{device.utilization}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
