/**
 * 设备管理测试数据工厂
 *
 * 提供类型安全的测试数据创建函数
 * 使用 faker 生成随机数据，确保测试数据唯一性
 */

import { faker } from '@faker-js/faker'
import { testPrisma } from './test-db'
import { createTestUser, createTestProject } from './test-data-factory'

type DeviceStatus = 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE' | 'DISABLED'
type BookingStatus = 'PENDING_APPROVAL' | 'RESERVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface DeviceTypeOverrides {
  name?: string
  modelName?: string
  location?: string
  description?: string | null
  owner?: string | null
}

interface DeviceOverrides {
  name?: string
  status?: DeviceStatus
}

interface BookingOverrides {
  startTime?: Date
  endTime?: Date
  projectId?: string | null
  status?: BookingStatus
}

export async function createTestDeviceType(overrides: DeviceTypeOverrides = {}) {
  return testPrisma.device_types.create({
    data: {
      id: faker.string.uuid(),
      name: overrides.name ?? `type-${faker.string.alphanumeric(8)}`,
      modelName: overrides.modelName ?? faker.commerce.productName(),
      location: overrides.location ?? faker.location.buildingNumber(),
      description: overrides.description,
      owner: overrides.owner,
      updatedAt: new Date(),
    },
  })
}

export async function createTestDevice(typeId: string, overrides: DeviceOverrides = {}) {
  return testPrisma.devices.create({
    data: {
      id: faker.string.uuid(),
      name: overrides.name ?? `device-${faker.string.alphanumeric(8)}`,
      typeId,
      status: overrides.status ?? 'AVAILABLE',
      updatedAt: new Date(),
    },
  })
}

export async function createTestBooking(
  deviceId: string,
  userId: string,
  overrides: BookingOverrides = {}
) {
  const startTime = overrides.startTime ?? new Date()
  const endTime = overrides.endTime ?? new Date(Date.now() + 3600000)

  return testPrisma.bookings.create({
    data: {
      id: faker.string.uuid(),
      deviceId,
      userId,
      projectId: overrides.projectId,
      startTime,
      endTime,
      status: overrides.status ?? 'RESERVED',
      updatedAt: new Date(),
    },
  })
}
