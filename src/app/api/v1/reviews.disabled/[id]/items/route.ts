import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

export async function GET(request: NextRequest, context: any) {
  const reviewId = context.params.reviewId;

  try {
    const items = await prisma.reviewItem.findMany({
      where: { reviewId },
      orderBy: { category: 'asc' },
    });

    return NextResponse.json(success(items));
  } catch (err) {
    console.error('获取评审项列表失败:', err);
    return error('获取评审项列表失败_ERROR', '获取评审项列表失败', undefined, 500);
  }
}

// POST /api/v1/reviews/[id]/items - 创建评审项
export async function POST(request: NextRequest, context: any) {
  const reviewId = context.params.reviewId;

  try {
    const body = await request.json();
    const { title, category, isRequired } = body;

    if (!title) {
      return error('标题不能为空_ERROR', '标题不能为空', undefined, 400);
    }

    const item = await prisma.reviewItem.create({
      data: {
        review: { connect: { id: reviewId } },
        title,
        category,
        isRequired,
      },
    });

    return NextResponse.json(success(item));
  } catch (err) {
    console.error('创建评审项失败:', err);
    return error('创建评审项失败_ERROR', '创建评审项失败', undefined, 500);
  }
}
