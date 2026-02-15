import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

export async function GET(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        type: true,
        project: true,
        materials: true,
        participants: true,
        items: {
          select: {
            title: true,
            category: true,
            isRequired: true,
          },
        },
      },
    });

    if (!review) {
      return error('REVIEW_NOT_FOUND', '评审不存在', undefined, 404);
    }

    return NextResponse.json(success(review));
  } catch (err) {
    console.error('获取评审详情失败:', err);
    return error('FETCH_REVIEW_FAILED', '获取评审详情失败', undefined, 500);
  }
}

// PUT /api/v1/reviews/[id] - 更新评审
export async function PUT(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    const body = await request.json();

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return error('REVIEW_NOT_FOUND', '评审不存在', undefined, 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.scheduledAt !== undefined) updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.typeId !== undefined) updateData.typeId = body.typeId;
    if (body.status !== undefined) updateData.status = body.status;

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(success(updatedReview));
  } catch (err) {
    console.error('更新评审失败:', err);
    return error('UPDATE_REVIEW_FAILED', '更新评审失败', undefined, 500);
  }
}

// DELETE /api/v1/reviews/[id] - 删除评审
export async function DELETE(request: NextRequest, context: any) {
  const id = context.params.id;

  try {
    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return error('REVIEW_NOT_FOUND', '评审不存在', undefined, 404);
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json(success({ message: '评审已删除' }));
  } catch (err) {
    console.error('删除评审失败:', err);
    return error('DELETE_REVIEW_FAILED', '删除评审失败', undefined, 500);
  }
}
