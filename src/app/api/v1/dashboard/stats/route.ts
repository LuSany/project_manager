import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/dashboard/stats - 获取项目统计概览
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return error('项目ID不能为空_ERROR', '项目ID不能为空', undefined, 400);
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
