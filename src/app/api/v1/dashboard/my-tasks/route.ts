import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/dashboard/my-tasks - 获取我的任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return error('USER_ID_REQUIRED', '用户ID不能为空', undefined, 400);
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
    return error('FETCH_MY_TASKS_FAILED', '获取我的任务失败', undefined, 500);
  }
}
