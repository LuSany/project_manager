/**
 * Booking 模型测试 - P0 核心业务模型
 *
 * 测试覆盖:
 * - 基本CRUD操作
 * - 时间验证（startTime, endTime）
 * - 冲突检测（同设备重叠预定）
 * - 关系（多对一device、user，可选project）
 * - 级联删除
 *
 * 优先级：P0 - 核心业务模型
 * 目标覆盖率：100%
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestDeviceType,
  createTestDevice,
  createTestBooking,
} from '../helpers/device-test-factory'

describe('Booking Model - P0 Core', () => {
  describe('Basic Operations', () => {
    it.todo('should create booking successfully')
    it.todo('should create booking with RESERVED status by default')
    it.todo('should update booking status')
    it.todo('should cancel booking (set status to CANCELLED)')
  })

  describe('Time Validation', () => {
    it.todo('should store startTime and endTime as DateTime')
    it.todo('should allow querying bookings by time range')
  })

  describe('Conflict Detection', () => {
    it.todo('should detect overlapping bookings for same device')
    it.todo('should allow non-overlapping bookings for same device')
    it.todo('should allow overlapping bookings for different devices')
  })

  describe('Relations', () => {
    it.todo('should belong to device')
    it.todo('should belong to user')
    it.todo('should optionally belong to project')
    it.todo('should cascade delete when device deleted')
  })
})
