import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/dashboard/stats - 获取项目统计概览
export async function GET(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return error('USER_NOT_FOUND', '用户不存在', undefined, 404);
    }

    // 构建查询条件：管理员可以看到所有项目，普通用户只能看到自己有权限的项目
    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.OR = [
        { ownerId: userId },
        { members: { some: { userId: userId } } }
      ];
    }

    // 并行获取项目统计、任务统计、风险统计
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      myTasksCount,
      highRisksCount
    ] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.project.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          OR: [
            { assignees: { some: { userId } } },
            { acceptorId: userId }
          ],
          status: { not: 'DONE' }
        }
      }),
      prisma.risk.count({
        where: {
          riskLevel: 'HIGH',
          status: { not: 'RESOLVED' }
        }
      }),
    ]);

    return success({
      totalProjects,
      activeProjects,
      completedProjects,
      myTasksCount,
      highRisksCount,
    });
  } catch (err) {
    console.error('获取项目统计失败:', err);
    return error('获取项目统计失败_ERROR', '获取项目统计失败', undefined, 500);
  }
}