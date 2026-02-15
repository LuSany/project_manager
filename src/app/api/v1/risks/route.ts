import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

// GET /api/v1/risks - 获取风险列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const risks = await prisma.risk.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(success(risks));
  } catch (err) {
    console.error('获取风险列表失败:', err);
    return NextResponse.json(error('获取风险列表失败', 500));
  }
}

// POST /api/v1/risks - 创建风险
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, probability, impact, ownerId, projectId } = body;

    if (!title || !ownerId) {
      return NextResponse.json(error('标题和所有者不能为空', 400));
    }

    const risk = await prisma.risk.create({
      data: {
        title,
        description,
        status: 'IDENTIFIED',
        priority: priority || 'MEDIUM',
        probability: probability || 'MEDIUM',
        impact: impact || 'MEDIUM',
        ownerId,
        projectId: projectId || null,
      },
    });

    return NextResponse.json(success(risk));
  } catch (err) {
    console.error('创建风险失败:', err);
    return NextResponse.json(error('创建风险失败', 500));
  }
}

// PUT /api/v1/risks/[id] - 更新风险
export async function PUT(
  request: NextRequest,
  { params }: { id: string }
) {
  try {
    const body = await request.json();
    const { title, description, status, priority, probability, impact } = body;

    const risk = await prisma.risk.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status,
        priority,
        probability,
        impact,
      },
    });

    return NextResponse.json(success(risk));
  } catch (err) {
    console.error('更新风险失败:', err);
    return NextResponse.json(error('更新风险失败', 500));
  }
}

// DELETE /api/v1/risks/[id] - 删除风险
export async function DELETE(
  request: NextRequest,
  { params }: { id: string }
) {
  try {
    await prisma.risk.delete({
      where: { id: params.id },
    });

    return NextResponse.json(success({ message: '风险已删除' }));
  } catch (err) {
    console.error('删除风险失败:', err);
    return NextResponse.json(error('删除风险失败', 500));
  }
}
