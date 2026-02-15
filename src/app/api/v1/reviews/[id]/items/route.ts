import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// POST /api/v1/reviews/[id]/items - 添加评审项
const createItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  isRequired: z.boolean().default(false),
  order: z.number().int().default(0),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = createItemSchema.parse(body);

    // 检查评审是否存在
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });
    if (!review) {
      return NextResponse.json(error('评审不存在', 404));
    }

    const item = await prisma.reviewItem.create({
      data: {
        reviewId: params.id,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        isRequired: validated.isRequired,
        order: validated.order,
      },
    });

    return NextResponse.json(success(item));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(error('参数验证失败', 400, err.errors));
    }
    console.error('添加评审项失败:', err);
    return NextResponse.json(error('添加评审项失败', 500));
  }
}

// GET /api/v1/reviews/[id]/items - 获取评审项列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.reviewItem.findMany({
      where: { reviewId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(success(items));
  } catch (err) {
    console.error('获取评审项列表失败:', err);
    return NextResponse.json(error('获取评审项列表失败', 500));
  }
}
