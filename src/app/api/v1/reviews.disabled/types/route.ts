import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// GET /api/v1/reviews/types - 获取评审类型列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const types = await prisma.reviewTypeConfig.findMany({
      where,
      orderBy: { displayName: 'asc' },
    });

    return NextResponse.json(success(types));
  } catch (err) {
    console.error('获取评审类型列表失败:', err);
    return error('获取评审类型列表失败_ERROR', '获取评审类型列表失败', undefined, 500);
  }
}

// POST /api/v1/reviews/types - 创建评审类型
const createReviewTypeSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createReviewTypeSchema.parse(body);

    const type = await prisma.reviewTypeConfig.create({
      data: {
        name: validated.name,
        displayName: validated.displayName,
        description: validated.description,
        isSystem: validated.isSystem,
      },
    });

    return NextResponse.json(success(type));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('参数验证失败_ERROR', '参数验证失败', { errors: err.errors }, 400);
    }
    console.error('创建评审类型失败:', err);
    return error('创建评审类型失败_ERROR', '创建评审类型失败', undefined, 500);
  }
}
