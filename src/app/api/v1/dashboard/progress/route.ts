import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/dashboard/progress - 获取进度追踪数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return error('PROJECT_ID_REQUIRED', '项目ID不能为空', undefined, 400);
    }

    // 获取里程碑进度
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    });

    // 获取任务完成率
    const totalTasks = await prisma.task.count({ where: { projectId } });
    const completedTasks = await prisma.task.count({ where: { projectId, status: 'DONE' } });

    const milestoneProgress = milestones.map(m => ({
      id: m.id,
      title: m.title,
      progress: m.progress,
      dueDate: m.dueDate,
    }));

    return NextResponse.json(success({
      milestones: milestoneProgress,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    }));
  } catch (err) {
    console.error('获取进度追踪数据失败:', err);
    return error('FETCH_PROGRESS_FAILED', '获取进度追踪数据失败', undefined, 500);
  }
}
