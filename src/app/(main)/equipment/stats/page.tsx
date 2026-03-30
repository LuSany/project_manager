'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { BarChart3 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatsOverview } from '@/components/equipment/StatsOverview'
import { ProjectHoursChart } from '@/components/equipment/ProjectHoursChart'
import {
  DeviceUtilizationChart,
  DeviceUtilizationList,
} from '@/components/equipment/DeviceUtilizationChart'
import { UsageRecordsTable } from '@/components/equipment/UsageRecordsTable'
import { ExcelExportButton } from '@/components/equipment/ExcelExportButton'
import { Card, CardContent } from '@/components/ui/card'

export default function EquipmentStatsPage() {
  const [activeTab, setActiveTab] = useState('project-hours')
  const now = new Date()
  const [month, setMonth] = useState(format(now, 'yyyy-MM'))
  const [startDate, setStartDate] = useState(
    format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd'))

  const getExportParams = () => {
    if (activeTab === 'project-hours') {
      return { month }
    } else if (activeTab === 'device-utilization') {
      return { startDate, endDate }
    } else {
      return { startDate, endDate }
    }
  }

  const getExportType = () => {
    if (activeTab === 'project-hours') return 'project-hours'
    if (activeTab === 'device-utilization') return 'device-utilization'
    return 'usage-record'
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <BarChart3 className="h-6 w-6" />
          设备使用统计
        </h1>
        <ExcelExportButton type={getExportType() as any} params={getExportParams()} />
      </div>

      <StatsOverview />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">月份:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">开始日期:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">结束日期:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="project-hours">项目机时统计</TabsTrigger>
          <TabsTrigger value="device-utilization">设备使用率</TabsTrigger>
          <TabsTrigger value="usage-records">使用记录查询</TabsTrigger>
        </TabsList>

        <TabsContent value="project-hours" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <ProjectHoursChart month={month} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device-utilization" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <DeviceUtilizationChart startDate={startDate} endDate={endDate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage-records" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <UsageRecordsTable startDate={startDate} endDate={endDate} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
