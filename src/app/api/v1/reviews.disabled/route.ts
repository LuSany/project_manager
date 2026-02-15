import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// GET /api/v1/reviews - 获取评审列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const typeId = searchParams.get('typeId');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (typeId) where.typeId = typeId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        type: {
          select: { id: true, name: true, displayName: true },
        },
        materials: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(success(reviews));
  } catch (err) {
    console.error('获取评审列表失败:', err);
    return error('获取评审列表失败_ERROR', '获取评审列表失败', undefined, 500);
  }
}

// POST /api/v1/reviews - 创建评审
const createReviewSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  typeId: z.string().cuid(),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createReviewSchema.parse(body);

    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
    });
    if (!project) {
      return error('项目不存在_ERROR', '项目不存在', undefined, 404);
    }

    // 验证评审类型存在
    const reviewType = await prisma.reviewTypeConfig.findUnique({
      where: { id: validated.typeId },
    });
    if (!reviewType) {
      return error('评审类型不存在_ERROR', '评审类型不存在', undefined, 404);
    }

    const review = await prisma.review.create({
      data: {
        projectId: validated.projectId,
        title: validated.title,
        description: validated.description,
        typeId: validated.typeId,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
      },
      include: {
        project: true,
        type: true,
      },
    });

    return NextResponse.json(success(review));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('参数验证失败_ERROR', '参数验证失败', { errors: err.errors }, 400);
    }
    console.error('创建评审失败:', err);
    return error('创建评审失败_ERROR', '创建评审失败', undefined, 500);
  }
}
