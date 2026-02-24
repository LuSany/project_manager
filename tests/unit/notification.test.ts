import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    },
    notificationIgnore: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

import {
  createNotification,
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyTaskDueSoon,
  notifyTaskOverdue,
  notifyReviewInvited,
  notifyReviewCompleted,
  notifyRiskAlert,
} from '@/lib/notification'

describe('Notification Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const { prisma } = await import('@/lib/prisma')

      await createNotification({
        userId: 'user-1',
        type: 'TASK_ASSIGNED',
        title: 'Test Notification',
        content: 'Test content',
        link: '/test',
        projectId: 'project-1',
      })

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'TASK_ASSIGNED',
          title: 'Test Notification',
          content: 'Test content',
          link: '/test',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })

    it('should handle optional fields', async () => {
      const { prisma } = await import('@/lib/prisma')

      await createNotification({
        userId: 'user-1',
        type: 'TASK_ASSIGNED',
        title: 'Test',
        content: 'Content',
      })

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'TASK_ASSIGNED',
          title: 'Test',
          content: 'Content',
          link: null,
          projectId: null,
          isRead: false,
        },
      })
    })
  })

  describe('notifyTaskAssigned', () => {
    it('should create task assigned notification', async () => {
      const { prisma } = await import('@/lib/prisma')

      await notifyTaskAssigned('user-1', 'Implement feature', 'project-1', 'My Project', 'John Doe')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'TASK_ASSIGNED',
          title: '新任务分配',
          content: 'John Doe 为您在项目"My Project"中分配了新任务：Implement feature',
          link: '/projects/project-1/tasks',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })
  })

  describe('notifyTaskCompleted', () => {
    it('should create task completed notification', async () => {
      const { prisma } = await import('@/lib/prisma')

      await notifyTaskCompleted('user-1', 'Fix bug', 'project-1', 'My Project', 'Jane Doe')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'TASK_ASSIGNED',
          title: '任务已完成',
          content: 'Jane Doe 完成了项目"My Project"中的任务：Fix bug',
          link: '/projects/project-1/tasks',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })
  })

  describe('notifyTaskDueSoon', () => {
    it('should create task due soon notification', async () => {
      const { prisma } = await import('@/lib/prisma')

      await notifyTaskDueSoon('user-1', 'Complete report', 'project-1', 'My Project', '2024-12-31')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'TASK_DUE_REMINDER',
          title: '任务即将到期',
          content: '项目"My Project"中的任务"Complete report"将于 2024-12-31 到期，请及时处理',
          link: '/projects/project-1/tasks',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })
  })

  describe('notifyTaskOverdue', () => {
    it('should create task overdue notification', async () => {
      const { prisma } = await import('@/lib/prisma')

      await notifyTaskOverdue('user-1', 'Urgent task', 'project-1', 'My Project')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'URGENT_TASK',
          title: '任务已逾期',
          content: '项目"My Project"中的任务"Urgent task"已逾期，请尽快处理',
          link: '/projects/project-1/tasks',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })
  })

  describe('notifyReviewInvited', () => {
    it('should create review invite notification', async () => {
      const { prisma } = await import('@/lib/prisma')

      await notifyReviewInvited('user-1', 'Design Review', 'project-1', 'My Project', 'Reviewer')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'REVIEW_INVITE',
          title: '评审邀请',
          content: 'Reviewer 邀请您参与项目"My Project"的评审：Design Review',
          link: '/projects/project-1/reviews',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })
  })

  describe('notifyReviewCompleted', () => {
    it('should create review completed notification', async () => {
      const { prisma } = await import('@/lib/prisma')

      await notifyReviewCompleted('user-1', 'Code Review', 'project-1', 'My Project', 'Approved')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'REVIEW_INVITE',
          title: '评审完成',
          content: '项目"My Project"中的评审"Code Review"已完成，结果：Approved',
          link: '/projects/project-1/reviews',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })
  })

  describe('notifyRiskAlert', () => {
    it('should create risk alert notification', async () => {
      const { prisma } = await import('@/lib/prisma')

      await notifyRiskAlert('user-1', 'project-1', 'My Project', 'HIGH', 75)

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'RISK_ALERT',
          title: '风险预警 - HIGH',
          content: '项目"My Project"的风险等级为HIGH（75分），请及时关注',
          link: '/projects/project-1/risks',
          projectId: 'project-1',
          isRead: false,
        },
      })
    })
  })
})
