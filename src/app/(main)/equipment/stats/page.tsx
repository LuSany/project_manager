'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { BarChart3 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const [deviceTypeId, setDeviceTypeId] = useState<string | undefined>(undefined)

  const { data: deviceTypes } = useQuery({
    queryKey: ['device-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/device-types?pageSize=100')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.items as { id: string; name: string }[]
    },
  })

  const getExportParams = () => {
    if (activeTab === 'project-hours') {
      return { month, deviceTypeId }
    } else if (activeTab === 'device-utilization') {
      return { startDate, endDate, deviceTypeId }
    } else if (activeTab === 'usage-records') {
      return { startDate, endDate }
    }
    // Default: complete-report with all params
    return { startDate, endDate, projectId: undefined, deviceTypeId }
  }

  const getExportType = (): 'project-hours' | 'device-utilization' | 'usage-record' | 'complete-report' => {
    if (activeTab === 'project-hours') return 'project-hours'
    if (activeTab === 'device-utilization') return 'device-utilization'
    if (activeTab === 'usage-records') return 'usage-record'
    return 'complete-report'
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
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">设备类型:</label>
          <Select
            value={deviceTypeId || 'all'}
            onValueChange={(v) => setDeviceTypeId(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {deviceTypes?.map((dt) => (
                <SelectItem key={dt.id} value={dt.id}>
                  {dt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <ProjectHoursChart month={month} deviceTypeId={deviceTypeId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device-utilization" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <DeviceUtilizationChart startDate={startDate} endDate={endDate} deviceTypeId={deviceTypeId} />
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
