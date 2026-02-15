import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/dashboard/stats - 获取项目统计概览
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(error('项目ID不能为空', 400));
    }

    // 并行获取项目数、进行中、已完成数
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
    ]);

    return NextResponse.json(success({
      totalProjects: totalProjects,
      activeProjects: activeProjects,
      completedProjects: completedProjects,
    }));
  } catch (err) {
    console.error('获取项目统计失败:', err);
    return NextResponse.json(error('获取项目统计失败', 500));
  }
}

// GET /api/v1/dashboard/my-tasks - 获取我的任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(error('用户ID不能为空', 400));
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignees: {
          some: {
            userId: userId,
          },
        },
        status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    return NextResponse.json(success(tasks));
  } catch (err) {
    console.error('获取我的任务失败:', err);
    return NextResponse.json(error('获取我的任务失败', 500));
  }
}

// GET /api/v1/dashboard/progress - 获取进度追踪数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(error('项目ID不能为空', 400));
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
    return NextResponse.json(error('获取进度追踪数据失败', 500));
  }
}
