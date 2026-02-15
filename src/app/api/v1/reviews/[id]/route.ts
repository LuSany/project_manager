import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// GET /api/v1/reviews/[id] - 获取评审详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { id: true, name: true, description: true },
        },
        type: {
          select: { id: true, name: true, displayName: true },
        },
        materials: {
          include: {
            file: {
              select: { id: true, fileName: true, fileSize: true, createdAt: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!review) {
      return NextResponse.json(error('评审不存在', 404));
    }

    return NextResponse.json(success(review));
  } catch (err) {
    console.error('获取评审详情失败:', err);
    return NextResponse.json(error('获取评审详情失败', 500));
  }
}

// PUT /api/v1/reviews/[id] - 更新评审
const updateReviewSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateReviewSchema.parse(body);

    // 检查评审是否存在
    const existing = await prisma.review.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(error('评审不存在', 404));
    }

    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.scheduledAt !== undefined) updateData.scheduledAt = new Date(validated.scheduledAt);
    if (validated.status !== undefined) updateData.status = validated.status;

    const review = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: true,
        type: true,
      },
    });

    return NextResponse.json(success(review));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(error('参数验证失败', 400, err.errors));
    }
    console.error('更新评审失败:', err);
    return NextResponse.json(error('更新评审失败', 500));
  }
}

// DELETE /api/v1/reviews/[id] - 删除评审
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查评审是否存在
    const existing = await prisma.review.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(error('评审不存在', 404));
    }

    await prisma.review.delete({
      where: { id: params.id },
    });

    return NextResponse.json(success({ message: '评审已删除' }));
  } catch (err) {
    console.error('删除评审失败:', err);
    return NextResponse.json(error('删除评审失败', 500));
  }
}
