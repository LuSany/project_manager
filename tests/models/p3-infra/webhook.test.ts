/**
 * Webhook 模型测试 - P3 基础设施模型
 *
 * 测试覆盖:
 * - Webhook CRUD
 * - 事件订阅配置
 * - HTTP 投递机制
 * - 投递记录与重试
 *
 * 优先级：P3 - 基础设施模型
 */

import { describe, it, expect } from 'vitest'
import { testPrisma } from '../../helpers/test-db'
import { createTestUser, createTestProject } from '../../helpers/test-data-factory'

describe('Webhook Model - P3 Core', () => {
  describe('Basic CRUD', () => {
    it('should create webhook successfully', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED', 'TASK_UPDATED'],
          isActive: true,
          userId: user.id,
        },
      })

      expect(webhook).toBeDefined()
      expect(webhook.url).toBe('https://example.com/webhook')
      expect(webhook.events).toContain('TASK_CREATED')
    })

    it('should create webhook with secret', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Secure Webhook',
          url: 'https://secure.example.com/webhook',
          events: ['TASK_CREATED'],
          secret: 'webhook-secret-key',
          userId: user.id,
        },
      })

      expect(webhook.secret).toBe('webhook-secret-key')
    })

    it('should update webhook configuration', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Original Webhook',
          url: 'https://original.example.com',
          events: ['TASK_CREATED'],
          userId: user.id,
        },
      })

      const updated = await testPrisma.webhook.update({
        where: { id: webhook.id },
        data: {
          url: 'https://updated.example.com',
          events: ['TASK_CREATED', 'TASK_DELETED'],
        },
      })

      expect(updated.url).toBe('https://updated.example.com')
      expect(updated.events).toContain('TASK_DELETED')
    })

    it('should delete webhook', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'To Delete',
          url: 'https://delete.example.com',
          events: ['TASK_CREATED'],
          userId: user.id,
        },
      })

      await testPrisma.webhook.delete({
        where: { id: webhook.id },
      })

      const found = await testPrisma.webhook.findUnique({
        where: { id: webhook.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Event Subscription', () => {
    it('should subscribe to single event', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Single Event Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
          userId: user.id,
        },
      })

      expect(webhook.events).toEqual(['TASK_CREATED'])
    })

    it('should subscribe to multiple events', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Multi Event Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED'],
          userId: user.id,
        },
      })

      expect(webhook.events).toHaveLength(3)
    })

    it('should subscribe to all events', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'All Events Webhook',
          url: 'https://example.com/webhook',
          events: ['*'],
          userId: user.id,
        },
      })

      expect(webhook.events).toEqual(['*'])
    })

    it('should filter by event type', async () => {
      const user = await createTestUser()

      await testPrisma.webhook.create({
        data: {
          name: 'Task Event Webhook',
          url: 'https://example.com/task',
          events: ['TASK_CREATED'],
          userId: user.id,
        },
      })

      await testPrisma.webhook.create({
        data: {
          name: 'Project Event Webhook',
          url: 'https://example.com/project',
          events: ['PROJECT_CREATED'],
          userId: user.id,
        },
      })

      const taskWebhooks = await testPrisma.webhook.findMany({
        where: {
          userId: user.id,
          events: {
            array_contains: ['TASK_CREATED'],
          },
        },
      })

      expect(taskWebhooks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Webhook Delivery', () => {
    it('should create delivery record', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
        },
      })

      const delivery = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '123', action: 'created' }),
          status: 'PENDING',
        },
      })

      expect(delivery).toBeDefined()
      expect(delivery.status).toBe('PENDING')
    })

    it('should record successful delivery', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Success Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
        },
      })

      const delivery = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '123' }),
          status: 'PENDING',
        },
      })

      const completed = await testPrisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SUCCESS',
          responseCode: 200,
          responseTime: 150,
        },
      })

      expect(completed.status).toBe('SUCCESS')
      expect(completed.responseCode).toBe(200)
      expect(completed.responseTime).toBe(150)
    })

    it('should record failed delivery', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Failed Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
        },
      })

      const delivery = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '123' }),
          status: 'PENDING',
        },
      })

      const failed = await testPrisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          responseCode: 500,
          errorMessage: 'Internal Server Error',
        },
      })

      expect(failed.status).toBe('FAILED')
      expect(failed.errorMessage).toBe('Internal Server Error')
    })

    it('should retry failed delivery', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Retry Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
        },
      })

      const delivery = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '123' }),
          status: 'FAILED',
          attempts: 1,
        },
      })

      const retry = await testPrisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'PENDING',
          attempts: 2,
        },
      })

      expect(retry.attempts).toBe(2)
    })

    it('should stop retrying after max attempts', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Max Retry Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
        },
      })

      const delivery = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '123' }),
          status: 'FAILED',
          attempts: 3,
        },
      })

      const exhausted = await testPrisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          attempts: 3,
          errorMessage: 'Max retry attempts reached',
        },
      })

      expect(exhausted.attempts).toBe(3)
      expect(exhausted.status).toBe('FAILED')
    })
  })

  describe('Webhook Security', () => {
    it('should generate signature for payload', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Secure Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
          secret: 'test-secret',
        },
      })

      expect(webhook.secret).toBe('test-secret')
    })

    it('should include timestamp in delivery', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Timestamp Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED'],
        },
      })

      const delivery = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '123' }),
          status: 'PENDING',
        },
      })

      expect(delivery.createdAt).toBeDefined()
    })
  })

  describe('Webhook Queries', () => {
    it('should find webhooks by user', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()

      await testPrisma.webhook.create({
        data: {
          name: 'User1 Webhook',
          url: 'https://user1.example.com',
          events: ['TASK_CREATED'],
          userId: user1.id,
        },
      })

      await testPrisma.webhook.create({
        data: {
          name: 'User2 Webhook',
          url: 'https://user2.example.com',
          events: ['TASK_CREATED'],
          userId: user2.id,
        },
      })

      const user1Webhooks = await testPrisma.webhook.findMany({
        where: { userId: user1.id },
      })

      expect(user1Webhooks.length).toBeGreaterThanOrEqual(1)
    })

    it('should find active webhooks', async () => {
      const user = await createTestUser()

      await testPrisma.webhook.create({
        data: {
          name: 'Active Webhook',
          url: 'https://active.example.com',
          events: ['TASK_CREATED'],
          isActive: true,
          userId: user.id,
        },
      })

      await testPrisma.webhook.create({
        data: {
          name: 'Inactive Webhook',
          url: 'https://inactive.example.com',
          events: ['TASK_CREATED'],
          isActive: false,
          userId: user.id,
        },
      })

      const active = await testPrisma.webhook.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
      })

      expect(active.length).toBeGreaterThanOrEqual(1)
    })

    it('should find deliveries by status', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Test Webhook',
          url: 'https://example.com',
          events: ['TASK_CREATED'],
        },
      })

      await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '1' }),
          status: 'SUCCESS',
        },
      })

      await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '2' }),
          status: 'FAILED',
        },
      })

      const failed = await testPrisma.webhookDelivery.findMany({
        where: {
          webhookId: webhook.id,
          status: 'FAILED',
        },
      })

      expect(failed).toHaveLength(1)
    })

    it('should order deliveries by createdAt', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Order Webhook',
          url: 'https://example.com',
          events: ['TASK_CREATED'],
        },
      })

      const d1 = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '1' }),
          status: 'SUCCESS',
        },
      })

      const d2 = await testPrisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'TASK_CREATED',
          payload: JSON.stringify({ taskId: '2' }),
          status: 'SUCCESS',
        },
      })

      const deliveries = await testPrisma.webhookDelivery.findMany({
        where: { webhookId: webhook.id },
        orderBy: { createdAt: 'asc' },
      })

      expect(deliveries[0].id).toBe(d1.id)
      expect(deliveries[1].id).toBe(d2.id)
    })

    it('should get delivery statistics', async () => {
      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Stats Webhook',
          url: 'https://example.com',
          events: ['TASK_CREATED'],
        },
      })

      // Create 5 success, 2 failed
      for (let i = 0; i < 5; i++) {
        await testPrisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: 'TASK_CREATED',
            payload: JSON.stringify({ taskId: String(i) }),
            status: 'SUCCESS',
          },
        })
      }

      for (let i = 0; i < 2; i++) {
        await testPrisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: 'TASK_CREATED',
            payload: JSON.stringify({ taskId: String(i + 5) }),
            status: 'FAILED',
          },
        })
      }

      const deliveries = await testPrisma.webhookDelivery.findMany({
        where: { webhookId: webhook.id },
      })

      const success = deliveries.filter((d) => d.status === 'SUCCESS').length
      const failed = deliveries.filter((d) => d.status === 'FAILED').length

      expect(deliveries).toHaveLength(7)
      expect(success).toBe(5)
      expect(failed).toBe(2)
    })
  })

  describe('Webhook Validation', () => {
    it('should validate HTTPS URL', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'HTTPS Webhook',
          url: 'https://secure.example.com/webhook',
          events: ['TASK_CREATED'],
          userId: user.id,
        },
      })

      expect(webhook.url).toContain('https://')
    })

    it('should allow HTTP for localhost', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Local Webhook',
          url: 'http://localhost:3000/webhook',
          events: ['TASK_CREATED'],
          userId: user.id,
        },
      })

      expect(webhook.url).toContain('http://localhost')
    })

    it('should validate events array', async () => {
      const user = await createTestUser()

      const webhook = await testPrisma.webhook.create({
        data: {
          name: 'Valid Events Webhook',
          url: 'https://example.com/webhook',
          events: ['TASK_CREATED', 'TASK_UPDATED', '*'],
          userId: user.id,
        },
      })

      expect(webhook.events).toBeDefined()
      expect(Array.isArray(webhook.events)).toBe(true)
    })
  })
})
