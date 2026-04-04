'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MyBookingsTable } from '@/components/bookings/MyBookingsTable'
import { AllBookingsTable } from '@/components/bookings/AllBookingsTable'

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('my')

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">预定管理</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Card>
          <CardHeader>
            <TabsList>
              <TabsTrigger value="my">我的预定</TabsTrigger>
              <TabsTrigger value="all">全部预定</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="my">
              <MyBookingsTable />
            </TabsContent>
            <TabsContent value="all">
              <AllBookingsTable />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
