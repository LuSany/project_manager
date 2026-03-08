import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/dashboard/activity - 获取活动趋势数据
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404);
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const days = range === '30d' ? 30 : 7;

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // 生成日期列表
    const dateList: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dateList.push(date.toISOString().split('T')[0]);
    }

    // 构建项目查询条件
    const projectWhere: any = {};
    if (user.role !== 'ADMIN') {
      projectWhere.OR = [
        { ownerId: userId },
        { members: { some: { userId: userId } } }
      ];
    }

    // 获取项目 ID 列表
    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);

    // 获取任务完成数据
    const completedTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'DONE',
        updatedAt: { gte: startDate, lte: endDate },
      },
      select: {
        updatedAt: true,
      },
    });

    // 获取项目创建数据
    const createdProjects = await prisma.project.findMany({
      where: {
        ...projectWhere,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
      },
    });

    // 获取评审完成数据
    const completedReviews = await prisma.review.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'COMPLETED',
        updatedAt: { gte: startDate, lte: endDate },
      },
      select: {
        updatedAt: true,
      },
    });

    // 按日期统计
    const countByDate = (items: { updatedAt: Date }[] | { createdAt: Date }[]) => {
      const counts: Record<string, number> = {};
      dateList.forEach(date => counts[date] = 0);

      items.forEach((item: any) => {
        const dateKey = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
        if (counts[dateKey] !== undefined) {
          counts[dateKey]++;
        }
      });

      return dateList.map(date => counts[date]);
    };

    const tasksByDate = countByDate(completedTasks);
    const projectsByDate = countByDate(createdProjects);
    const reviewsByDate = countByDate(completedReviews);

    // 构建返回数据
    const data = dateList.map((date, index) => ({
      date: new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      tasks: tasksByDate[index],
      projects: projectsByDate[index],
      reviews: reviewsByDate[index],
    }));

    return success(data);
  } catch (err) {
    console.error('获取活动数据失败:', err);
    return error('获取活动数据失败_ERROR', '获取活动数据失败', undefined, 500);
  }
}