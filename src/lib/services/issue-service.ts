import { db } from '@/lib/db';

/**
 * 检查 Issue 是否应该自动关闭
 * 当 Issue 的 autoClose 为 true 且所有关联任务都完成时，将 Issue 状态改为 RESOLVED
 */
export async function checkIssueAutoClose(issueId: string): Promise<void> {
  try {
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: { tasks: true }
    });

    if (!issue || !issue.autoClose) {
      return;
    }

    // 检查是否所有任务都已完成
    const allTasksCompleted = issue.tasks.every(
      task => task.status === 'DONE'
    );

    // 只有在 Issue 不是 RESOLVED 或 CLOSED 状态时才自动更新
    if (allTasksCompleted && issue.status !== 'RESOLVED' && issue.status !== 'CLOSED') {
      await db.issue.update({
        where: { id: issueId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });

      console.log(`[IssueService] Issue ${issueId} automatically closed as all tasks are completed`);
    }
  } catch (error) {
    console.error(`[IssueService] Error checking auto-close for issue ${issueId}:`, error);
    // 不抛出错误，避免影响主流程
  }
}
