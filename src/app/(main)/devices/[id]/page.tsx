'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { DeviceDetailCard } from '@/components/devices/DeviceDetailCard'
import { DeviceBookingCalendar } from '@/components/devices/DeviceBookingCalendar'
import { BookingHistoryList } from '@/components/devices/BookingHistoryList'

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const {
    data: device,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['device', resolvedParams?.id],
    queryFn: async () => {
      if (!resolvedParams?.id) return null
      const res = await fetch(`/api/v1/devices/${resolvedParams.id}`)
      const json = await res.json()
      if (!json.success) {
        if (res.status === 404) return null
        throw new Error(json.error)
      }
      return json.data
    },
    enabled: !!resolvedParams?.id,
  })

  if (isLoading || !resolvedParams) {
    return <div className="p-6">加载中...</div>
  }

  if (!device) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <DeviceDetailCard device={device} />
      <DeviceBookingCalendar deviceId={resolvedParams.id} deviceStatus={device.status} />
      <BookingHistoryList deviceId={resolvedParams.id} />
    </div>
  )
}
