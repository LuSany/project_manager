import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'


export type NotificationType =
  | 'RISK_ALERT'
  | 'REVIEW_INVITE'
  | 'URGENT_TASK'
  | 'TASK_DUE_REMINDER'
  | 'TASK_ASSIGNED'
  | 'COMMENT_MENTION'
  | 'DAILY_DIGEST'
  | 'REVIEW_COMMENT'
  | 'COMMENT_REPLY'
  | 'COMMENT_RESOLVED'
  | 'REVIEW_ALL_AGREED'

// Notification channel types
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS'

interface CreateNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  content: string
  link?: string
  projectId?: string
}

/**
 * 获取用户的通知偏好设置
 */
async function getUserNotificationPreference(
  userId: string,
  type: NotificationType
): Promise<{ enabled: boolean; channel: NotificationChannel } | null> {
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_type_channel: {
        userId,
        type,
        channel: 'IN_APP',
      },
    },
  })

  // 如果没有设置偏好，默认启用站内通知
  if (!preference) {
    return { enabled: true, channel: 'IN_APP' }
  }

  return {
    enabled: preference.enabled,
    channel: preference.channel as NotificationChannel,
  }
}

/**
 * 获取用户的所有通知偏好设置
 */
async function getAllUserNotificationPreferences(
  userId: string
): Promise<Array<{ type: NotificationType; enabled: boolean; channel: NotificationChannel }>> {
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId },
  })

  return preferences.map((p) => ({
    type: p.type,
    enabled: p.enabled,
    channel: p.channel as NotificationChannel,
  }))
}

/**
 * 检查是否应该发送邮件通知
 */
async function shouldSendEmail(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const preference = await getUserNotificationPreference(userId, type)

  // 如果通知被禁用，不发送
  if (!preference || !preference.enabled) {
    return false
  }

  // 检查是否配置了邮件渠道
  const emailPreference = await prisma.notificationPreference.findUnique({
    where: {
      userId_type_channel: {
        userId,
        type,
        channel: 'EMAIL',
      },
    },
  })

  return emailPreference?.enabled ?? false
}

/**
 * 发送邮件通知
 */
async function sendEmailNotification(
  userId: string,
  type: NotificationType,
  title: string,
  content: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })

  if (!user?.email) {
    console.warn(`用户 ${userId} 没有邮箱地址，跳过邮件通知`)
    return
  }

  await sendEmail({
    to: user.email,
    subject: `[项目管理系统] ${title}`,
    body: content,
    templateType: type,
    userId,
  })
}

async function shouldSendNotification(userId: string): Promise<boolean> {
  return true
}

async function isProjectIgnored(userId: string, projectId?: string): Promise<boolean> {
  if (!projectId) return false

  const ignore = await prisma.notificationIgnore.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  })

  return !!ignore
}

export async function createNotification(options: CreateNotificationOptions): Promise<void> {
  const { userId, type, title, content, link, projectId } = options

  // 获取用户通知偏好
  const preference = await getUserNotificationPreference(userId, type)
  
  // 如果通知被禁用，直接返回
  if (!preference || !preference.enabled) {
    return
  }

  const shouldSend = await shouldSendNotification(userId)
  if (!shouldSend) {
    return
  }

  const isIgnored = await isProjectIgnored(userId, projectId)
  if (isIgnored) {
    return
  }

  // 创建站内通知
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      link: link || null,
      projectId: projectId || null,
      isRead: false,
    },
  })

  // 根据偏好设置发送邮件通知
  if (preference.channel === 'EMAIL' || preference.channel === 'IN_APP') {
    const sendEmail = await shouldSendEmail(userId, type)
    if (sendEmail) {
      await sendEmailNotification(userId, type, title, content)
    }
  }
}

export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  projectId: string,
  projectName: string,
  assignerName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'TASK_ASSIGNED',
    title: '新任务分配',
    content: `${assignerName} 为您在项目"${projectName}"中分配了新任务：${taskTitle}`,
    link: `/projects/${projectId}/tasks`,
    projectId,
  })
}

export async function notifyTaskCompleted(
  userId: string,
  taskTitle: string,
  projectId: string,
  projectName: string,
  completedBy: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'TASK_ASSIGNED',
    title: '任务已完成',
    content: `${completedBy} 完成了项目"${projectName}"中的任务：${taskTitle}`,
    link: `/projects/${projectId}/tasks`,
    projectId,
  })
}

export async function notifyTaskDueSoon(
  userId: string,
  taskTitle: string,
  projectId: string,
  projectName: string,
  dueDate: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'TASK_DUE_REMINDER',
    title: '任务即将到期',
    content: `项目"${projectName}"中的任务"${taskTitle}"将于 ${dueDate} 到期，请及时处理`,
    link: `/projects/${projectId}/tasks`,
    projectId,
  })
}

export async function notifyTaskOverdue(
  userId: string,
  taskTitle: string,
  projectId: string,
  projectName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'URGENT_TASK',
    title: '任务已逾期',
    content: `项目"${projectName}"中的任务"${taskTitle}"已逾期，请尽快处理`,
    link: `/projects/${projectId}/tasks`,
    projectId,
  })
}

export async function notifyReviewInvited(
  userId: string,
  reviewTitle: string,
  projectId: string,
  projectName: string,
  inviterName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'REVIEW_INVITE',
    title: '评审邀请',
    content: `${inviterName} 邀请您参与项目"${projectName}"的评审：${reviewTitle}`,
    link: `/projects/${projectId}/reviews`,
    projectId,
  })
}

export async function notifyReviewCompleted(
  userId: string,
  reviewTitle: string,
  projectId: string,
  projectName: string,
  result: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'REVIEW_INVITE',
    title: '评审完成',
    content: `项目"${projectName}"中的评审"${reviewTitle}"已完成，结果：${result}`,
    link: `/projects/${projectId}/reviews`,
    projectId,
  })
}

export async function notifyRiskAlert(
  userId: string,
  projectId: string,
  projectName: string,
  riskLevel: string,
  riskScore: number
): Promise<void> {
  await createNotification({
    userId,
    type: 'RISK_ALERT',
    title: `风险预警 - ${riskLevel}`,
    content: `项目"${projectName}"的风险等级为${riskLevel}（${riskScore}分），请及时关注`,
    link: `/projects/${projectId}/risks`,
    projectId,
  })
}
