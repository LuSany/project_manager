import { NextRequest, NextResponse } from 'next/server';
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return error('项目ID不能为空_ERROR', '项目ID不能为空', undefined, 400);
    }

    // 验证用户是否为项目成员
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404);
    }

    if (project.ownerId !== userId && project.members.length === 0) {
      return error('FORBIDDEN_ERROR', '无权访问此项目', undefined, 403);
    }

    // 并行获取项目总数、进行中、已完成数
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
    ]);

    return NextResponse.json(success({
      totalProjects,
      activeProjects,
      completedProjects,
    }));
  } catch (err) {
    console.error('获取项目统计失败:', err);
    return error('获取项目统计失败_ERROR', '获取项目统计失败', undefined, 500);
  }
}
