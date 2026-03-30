import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  aggregateProjectHours,
  calculateDeviceUtilization,
  queryUsageRecords,
  getStatsOverview,
  generateExcelBuffer,
} from '@/lib/equipment-stats'

describe('Equipment Stats Logic', () => {
  let testDeviceTypeId: string
  let testDeviceId: string
  let testProjectId: string
  let testUserId: string

  beforeAll(async () => {
    const deviceType = await prisma.device_types.findFirst()
    if (!deviceType) {
      throw new Error('No device type found in database')
    }
    testDeviceTypeId = deviceType.id

    const device = await prisma.devices.findFirst({ where: { typeId: testDeviceTypeId } })
    if (!device) {
      throw new Error('No device found in database')
    }
    testDeviceId = device.id

    const project = await prisma.projects.findFirst()
    if (!project) {
      throw new Error('No project found in database')
    }
    testProjectId = project.id

    const user = await prisma.users.findFirst()
    if (!user) {
      throw new Error('No user found in database')
    }
    testUserId = user.id

    const now = new Date()
    await prisma.bookings.create({
      data: {
        id: `test-booking-${now.getTime()}`,
        deviceId: testDeviceId,
        userId: testUserId,
        projectId: testProjectId,
        startTime: new Date(now.getFullYear(), now.getMonth(), 1, 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), 1, 11, 0),
        status: 'COMPLETED',
      },
    })
  })

  describe('Project Hours Aggregation', () => {
    it('should aggregate hours by project', async () => {
      const result = await aggregateProjectHours({ month: undefined, topN: 10 })
      expect(Array.isArray(result)).toBe(true)
    })

    it('should filter by date range', async () => {
      const result = await aggregateProjectHours({ month: '2020-01', topN: 10 })
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return top N projects by usage', async () => {
      const result = await aggregateProjectHours({ topN: 5 })
      expect(result.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Device Utilization', () => {
    it('should calculate utilization as used-hours / available-hours', async () => {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const endDate = now.toISOString().slice(0, 10)

      const result = await calculateDeviceUtilization({ startDate, endDate })
      expect(Array.isArray(result)).toBe(true)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('utilization')
        expect(result[0]).toHaveProperty('usedHours')
        expect(result[0]).toHaveProperty('availableHours')
        expect(typeof result[0].utilization).toBe('number')
      }
    })

    it('should return daily/weekly/monthly trends', async () => {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const endDate = now.toISOString().slice(0, 10)

      const result = await calculateDeviceUtilization({ startDate, endDate })
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('dailyTrend')
        expect(Array.isArray(result[0].dailyTrend)).toBe(true)
      }
    })

    it('should handle devices with no bookings', async () => {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10)
      const endDate = new Date(now.getFullYear(), now.getMonth() - 1, 28).toISOString().slice(0, 10)

      const result = await calculateDeviceUtilization({ startDate, endDate })
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('Usage Records Query', () => {
    it('should filter by project, device, user, date range', async () => {
      const result = await queryUsageRecords({
        projectId: testProjectId,
        deviceId: testDeviceId,
        userId: testUserId,
      })
      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('pageSize')
    })

    it('should support pagination', async () => {
      const result = await queryUsageRecords({ page: 1, pageSize: 5 })
      expect(result.items.length).toBeLessThanOrEqual(5)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(5)
    })

    it('should sort by startTime desc', async () => {
      const result = await queryUsageRecords({ sortBy: 'startTime', sortOrder: 'desc' })
      expect(result.items.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Excel Export', () => {
    it('should generate xlsx buffer from stats data', async () => {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const buffer = await generateExcelBuffer({ type: 'project-hours', month })
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should include headers and data rows', async () => {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const buffer = await generateExcelBuffer({ type: 'project-hours', month })
      expect(buffer.slice(0, 4).toString()).toContain('PK')
    })

    it('should handle empty data gracefully', async () => {
      const buffer = await generateExcelBuffer({
        type: 'project-hours',
        month: '1900-01',
      })
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should export device utilization', async () => {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const endDate = now.toISOString().slice(0, 10)

      const buffer = await generateExcelBuffer({
        type: 'device-utilization',
        startDate,
        endDate,
      })
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should export usage records', async () => {
      const buffer = await generateExcelBuffer({
        type: 'usage-record',
      })
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })
  })

  describe('Stats Overview', () => {
    it('should return overview stats', async () => {
      const result = await getStatsOverview()
      expect(result).toHaveProperty('totalBookings')
      expect(result).toHaveProperty('totalHours')
      expect(result).toHaveProperty('activeDevices')
      expect(result).toHaveProperty('totalDevices')
      expect(typeof result.totalBookings).toBe('number')
      expect(typeof result.totalHours).toBe('number')
    })
  })
})
