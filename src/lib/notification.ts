import { prisma } from '@/lib/prisma'

export type NotificationType =
  | 'RISK_ALERT'
  | 'REVIEW_INVITE'
  | 'URGENT_TASK'
  | 'TASK_DUE_REMINDER'
  | 'TASK_ASSIGNED'
  | 'COMMENT_MENTION'
  | 'DAILY_DIGEST'

export interface CreateNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  content: string
  link?: string
  projectId?: string
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

  const shouldSend = await shouldSendNotification(userId)
  if (!shouldSend) {
    return
  }

  const isIgnored = await isProjectIgnored(userId, projectId)
  if (isIgnored) {
    return
  }

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
