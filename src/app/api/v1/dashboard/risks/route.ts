import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/dashboard/risks - 获取风险看板数据
export async function GET(request: NextRequest) {
  try {
    // 从中间件设置的 cookies 获取用户信息
    const userId = request.cookies.get('user-id')?.value;

    if (!userId) {
      return error('UNAUTHORIZED_ERROR', '未授权，请先登录', undefined, 401);
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // 获取高风险项目（不指定 projectId 时返回全局数据）
    if (!projectId) {
      // 获取用户参与的项目
      const userProjects = await prisma.projects.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { project_members: { some: { users: { id: userId } } } },
          ],
        },
        select: { id: true },
      });

      const projectIds = userProjects.map(p => p.id);

      // 获取高风险和关键风险
      const highRisks = await prisma.risks.findMany({
        where: {
          projectId: { in: projectIds },
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
          status: { not: 'CLOSED' },
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { riskLevel: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10,
      });

      // 统计各风险级别数量
      const riskStats = {
        critical: await prisma.risks.count({
          where: { projectId: { in: projectIds }, riskLevel: 'CRITICAL', status: { not: 'CLOSED' } },
        }),
        high: await prisma.risks.count({
          where: { projectId: { in: projectIds }, riskLevel: 'HIGH', status: { not: 'CLOSED' } },
        }),
        medium: await prisma.risks.count({
          where: { projectId: { in: projectIds }, riskLevel: 'MEDIUM', status: { not: 'CLOSED' } },
        }),
        low: await prisma.risks.count({
          where: { projectId: { in: projectIds }, riskLevel: 'LOW', status: { not: 'CLOSED' } },
        }),
      };

      return NextResponse.json(success({
        risks: highRisks,
        stats: riskStats,
      }));
    }

    // 验证用户是否为项目成员
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        project_members: {
          where: { users: { id: userId } },
        },
      },
    });

    if (!project) {
      return error('PROJECT_NOT_FOUND', '项目不存在', undefined, 404);
    }

    if (project.ownerId !== userId && project.project_members.length === 0) {
      return error('FORBIDDEN_ERROR', '无权访问此项目', undefined, 403);
    }

    // 获取项目风险
    const risks = await prisma.risks.findMany({
      where: {
        projectId,
        status: { not: 'CLOSED' },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { riskLevel: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 统计各风险级别数量
    const riskStats = {
      critical: risks.filter(r => r.riskLevel === 'CRITICAL').length,
      high: risks.filter(r => r.riskLevel === 'HIGH').length,
      medium: risks.filter(r => r.riskLevel === 'MEDIUM').length,
      low: risks.filter(r => r.riskLevel === 'LOW').length,
    };

    return NextResponse.json(success({
      risks,
      stats: riskStats,
    }));
  } catch (err) {
    console.error('获取风险看板数据失败:', err);
    return error('FETCH_RISKS_FAILED', '获取风险看板数据失败', undefined, 500);
  }
}
