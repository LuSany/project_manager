import { DeviceTable } from '@/components/devices/DeviceTable'
import { DeviceFilterBar } from '@/components/devices/DeviceFilterBar'
import { DeviceCreateDialog } from '@/components/devices/DeviceCreateDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DevicesPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">设备管理</h1>
        <DeviceCreateDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>设备列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceFilterBar />
          <DeviceTable />
        </CardContent>
      </Card>
    </div>
  )
}
