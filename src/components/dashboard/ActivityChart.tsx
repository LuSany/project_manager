'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { Activity } from 'lucide-react'

interface ActivityData {
  date: string
  tasks: number
  projects: number
  reviews: number
}

type TimeRange = '7d' | '30d'

export function ActivityChart() {
  const [data, setData] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/v1/dashboard/activity?range=${timeRange}`)
        const result = await response.json()
        if (result.success) {
          setData(result.data || generateMockData(timeRange))
        } else {
          setData(generateMockData(timeRange))
        }
      } catch (e) {
        console.error('获取活动数据失败:', e)
        setData(generateMockData(timeRange))
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [timeRange])

  const generateMockData = (range: TimeRange): ActivityData[] => {
    const days = range === '7d' ? 7 : 30
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
        .toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      tasks: Math.floor(Math.random() * 10) + 1,
      projects: Math.floor(Math.random() * 3),
      reviews: Math.floor(Math.random() * 5)
    }))
  }

  const formatDate = (date: string) => {
    return date
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Activity className="h-5 w-5 text-blue-500" />
          活动趋势
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant={timeRange === '7d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('7d')}
            className="h-8 px-3"
          >
            7天
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('30d')}
            className="h-8 px-3"
          >
            30天
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontWeight: 'medium', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  name="完成任务"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTasks)"
                />
                <Area
                  type="monotone"
                  dataKey="projects"
                  name="创建项目"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProjects)"
                />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  name="完成评审"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReviews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 图例 */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">完成任务</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">创建项目</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">完成评审</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}