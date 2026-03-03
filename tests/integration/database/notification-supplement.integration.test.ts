/**
 * 通知系统补充集成测试
 *
 * 测试覆盖：
 * - 通知偏好设置
 * - 通知忽略管理
 * - 各类通知场景
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestDatabase, testPrisma } from '../helpers/test-db'
import {
  createTestUser,
  createTestProject,
  createTestNotification,
  createTestProjectMember,
} from '../helpers/test-data-factory'

// ============================================
// 测试套件
// ============================================

describe('通知系统补充集成测试', () => {
  setupTestDatabase()

  let testUser: { id: string }
  let testProject: { id: string }

  beforeEach(async () => {
    testUser = await createTestUser()
    testProject = await createTestProject(testUser.id)
    await createTestProjectMember(testProject.id, testUser.id, { role: 'OWNER' })
  })

  // ============================================
  // 通知类型测试
  // ============================================

  describe('通知类型', () => {
    it('应该支持 TASK_ASSIGNED 类型', async () => {
      const notification = await createTestNotification(testUser.id, {
        type: 'TASK_ASSIGNED',
        title: '任务分配通知',
      })
      expect(notification.type).toBe('TASK_ASSIGNED')
    })

    it('应该支持 TASK_COMPLETED 类型', async () => {
      const notification = await createTestNotification(testUser.id, {
        type: 'TASK_COMPLETED',
        title: '任务完成通知',
      })
      expect(notification.type).toBe('TASK_COMPLETED')
    })

    it('应该支持 TASK_DUE_SOON 类型', async () => {
      const notification = await createTestNotification(testUser.id, {
        type: 'TASK_DUE_SOON',
        title: '任务即将到期',
      })
      expect(notification.type).toBe('TASK_DUE_SOON')
    })

    it('应该支持 TASK_OVERDUE 类型', async () => {
      const notification = await createTestNotification(testUser.id, {
        type: 'TASK_OVERDUE',
        title: '任务已逾期',
      })
      expect(notification.type).toBe('TASK_OVERDUE')
    })

    it('应该支持 REVIEW_INVITED 类型', async () => {
      const notification = await createTestNotification(testUser.id, {
        type: 'REVIEW_INVITED',
        title: '评审邀请通知',
      })
      expect(notification.type).toBe('REVIEW_INVITED')
    })

    it('应该支持 REVIEW_COMPLETED 类型', async () => {
      const notification = await createTestNotification(testUser.id, {
        type: 'REVIEW_COMPLETED',
        title: '评审完成通知',
      })
      expect(notification.type).toBe('REVIEW_COMPLETED')
    })

    it('应该支持 RISK_ALERT 类型', async () => {
      const notification = await createTestNotification(testUser.id, {
        type: 'RISK_ALERT',
        title: '风险预警通知',
      })
      expect(notification.type).toBe('RISK_ALERT')
    })
  })

  // ============================================
  // 通知偏好设置测试
  // ============================================

  describe('通知偏好设置', () => {
    it('应该能创建通知偏好', async () => {
      const preference = await testPrisma.notificationPreference.create({
        data: {
          userId: testUser.id,
          type: 'TASK_ASSIGNED',
          enabled: true,
          channel: 'IN_APP',
        },
      })

      expect(preference).toBeDefined()
      expect(preference.enabled).toBe(true)
    })

    it('应该能禁用特定类型的通知', async () => {
      const preference = await testPrisma.notificationPreference.create({
        data: {
          userId: testUser.id,
          type: 'TASK_OVERDUE',
          enabled: false,
          channel: 'IN_APP',
        },
      })

      expect(preference.enabled).toBe(false)
    })

    it('应该能设置通知渠道', async () => {
      const emailPreference = await testPrisma.notificationPreference.create({
        data: {
          userId: testUser.id,
          type: 'RISK_ALERT',
          enabled: true,
          channel: 'EMAIL',
        },
      })

      expect(emailPreference.channel).toBe('EMAIL')
    })

    it('应该能查询用户的所有通知偏好', async () => {
      await testPrisma.notificationPreference.create({
        data: { userId: testUser.id, type: 'TASK_ASSIGNED', enabled: true, channel: 'IN_APP' },
      })
      await testPrisma.notificationPreference.create({
        data: { userId: testUser.id, type: 'RISK_ALERT', enabled: true, channel: 'EMAIL' },
      })

      const preferences = await testPrisma.notificationPreference.findMany({
        where: { userId: testUser.id },
      })

      expect(preferences.length).toBe(2)
    })

    it('应该能更新通知偏好', async () => {
      const preference = await testPrisma.notificationPreference.create({
        data: { userId: testUser.id, type: 'TASK_ASSIGNED', enabled: true, channel: 'IN_APP' },
      })

      const updated = await testPrisma.notificationPreference.update({
        where: { id: preference.id },
        data: { enabled: false },
      })

      expect(updated.enabled).toBe(false)
    })
  })

  // ============================================
  // 通知忽略管理测试
  // ============================================

  describe('通知忽略管理', () => {
    it('应该能忽略特定项目的通知', async () => {
      const ignore = await testPrisma.notificationIgnore.create({
        data: {
          userId: testUser.id,
          projectId: testProject.id,
        },
      })

      expect(ignore).toBeDefined()
      expect(ignore.userId).toBe(testUser.id)
      expect(ignore.projectId).toBe(testProject.id)
    })

    it('应该能查询用户忽略的所有项目', async () => {
      const project2 = await createTestProject(testUser.id)

      await testPrisma.notificationIgnore.create({
        data: { userId: testUser.id, projectId: testProject.id },
      })
      await testPrisma.notificationIgnore.create({
        data: { userId: testUser.id, projectId: project2.id },
      })

      const ignoredProjects = await testPrisma.notificationIgnore.findMany({
        where: { userId: testUser.id },
        include: { project: true },
      })

      expect(ignoredProjects.length).toBe(2)
    })

    it('应该能取消忽略项目', async () => {
      const ignore = await testPrisma.notificationIgnore.create({
        data: { userId: testUser.id, projectId: testProject.id },
      })

      await testPrisma.notificationIgnore.delete({
        where: { id: ignore.id },
      })

      const remaining = await testPrisma.notificationIgnore.findMany({
        where: { userId: testUser.id },
      })

      expect(remaining.length).toBe(0)
    })
  })

  // ============================================
  // 通知状态管理测试
  // ============================================

  describe('通知状态管理', () => {
    it('应该能创建已读通知', async () => {
      const notification = await createTestNotification(testUser.id, {
        isRead: true,
      })
      expect(notification.isRead).toBe(true)
    })

    it('应该能创建未读通知', async () => {
      const notification = await createTestNotification(testUser.id, {
        isRead: false,
      })
      expect(notification.isRead).toBe(false)
    })

    it('应该能标记通知为已读', async () => {
      const notification = await createTestNotification(testUser.id, { isRead: false })

      const updated = await testPrisma.notification.update({
        where: { id: notification.id },
        data: { isRead: true },
      })

      expect(updated.isRead).toBe(true)
    })

    it('应该能批量标记通知为已读', async () => {
      await createTestNotification(testUser.id, { isRead: false })
      await createTestNotification(testUser.id, { isRead: false })

      await testPrisma.notification.updateMany({
        where: { userId: testUser.id, isRead: false },
        data: { isRead: true },
      })

      const unreadCount = await testPrisma.notification.count({
        where: { userId: testUser.id, isRead: false },
      })

      expect(unreadCount).toBe(0)
    })

    it('应该能查询未读通知数量', async () => {
      await createTestNotification(testUser.id, { isRead: false })
      await createTestNotification(testUser.id, { isRead: false })
      await createTestNotification(testUser.id, { isRead: true })

      const unreadCount = await testPrisma.notification.count({
        where: { userId: testUser.id, isRead: false },
      })

      expect(unreadCount).toBe(2)
    })
  })

  // ============================================
  // 通知关联测试
  // ============================================

  describe('通知关联', () => {
    it('应该能关联通知到项目', async () => {
      const notification = await testPrisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: '新任务',
          content: '您有新任务',
          userId: testUser.id,
          projectId: testProject.id,
        },
      })

      expect(notification.projectId).toBe(testProject.id)
    })

    it('应该能查询项目的所有通知', async () => {
      await testPrisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: '通知1',
          content: '内容',
          userId: testUser.id,
          projectId: testProject.id,
        },
      })

      const projectNotifications = await testPrisma.notification.findMany({
        where: { projectId: testProject.id },
      })

      expect(projectNotifications.length).toBe(1)
    })
  })
})
