import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// POST /api/v1/reviews/[id]/participants - 添加评审参与者
const createParticipantSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['REVIEWER', 'OBSERVER', 'SECRETARY']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = createParticipantSchema.parse(body);

    // 检查评审是否存在
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });
    if (!review) {
      return NextResponse.json(error('评审不存在', 404));
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    });
    if (!user) {
      return NextResponse.json(error('用户不存在', 404));
    }

    // 检查是否已经是参与者
    const existing = await prisma.reviewParticipant.findUnique({
      where: {
        reviewId_userId: {
          reviewId: params.id,
          userId: validated.userId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(error('用户已是参与者', 400));
    }

    const participant = await prisma.reviewParticipant.create({
      data: {
        reviewId: params.id,
        userId: validated.userId,
        role: validated.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(success(participant));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(error('参数验证失败', 400, err.errors));
    }
    console.error('添加评审参与者失败:', err);
    return NextResponse.json(error('添加评审参与者失败', 500));
  }
}

// DELETE /api/v1/reviews/[id]/participants/[userId] - 移除评审参与者
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    await prisma.reviewParticipant.delete({
      where: {
        reviewId_userId: {
          reviewId: params.id,
          userId: params.userId,
        },
      },
    });

    return NextResponse.json(success({ message: '参与者已移除' }));
  } catch (err) {
    console.error('移除评审参与者失败:', err);
    return NextResponse.json(error('移除评审参与者失败', 500));
  }
}
