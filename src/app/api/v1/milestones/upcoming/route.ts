import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/milestones/upcoming - 获取即将到来的里程碑
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
    const limit = parseInt(searchParams.get('limit') || '3');

    // 构建项目查询条件
    const projectWhere: any = {};
    if (user.role !== 'ADMIN') {
      projectWhere.OR = [
        { ownerId: userId },
        { members: { some: { userId: userId } } }
      ];
    }

    // 获取用户有权限的项目 ID
    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
      return success([]);
    }

    // 获取即将到来的里程碑（未完成且截止日期在未来）
    const now = new Date();
    const milestones = await prisma.milestone.findMany({
      where: {
        projectId: { in: projectIds },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: {
          gte: now,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    });

    return success(milestones);
  } catch (err) {
    console.error('获取即将到来的里程碑失败:', err);
    return error('获取即将到来的里程碑失败_ERROR', '获取即将到来的里程碑失败', undefined, 500);
  }
}