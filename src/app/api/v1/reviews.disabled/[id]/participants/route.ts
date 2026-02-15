import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error } from '@/lib/api/response';

export async function GET(request: NextRequest, context: any) {
  const reviewId = context.params.reviewId;

  try {
    const participants = await prisma.reviewParticipant.findMany({
      where: { reviewId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(success(participants));
  } catch (err) {
    console.error('获取评审参与者列表失败:', err);
    return error('FETCH_PARTICIPANTS_FAILED', '获取评审参与者列表失败', undefined, 500);
  }
}

// POST /api/v1/reviews/[id]/participants - 添加评审参与者
export async function POST(request: NextRequest, context: any) {
  const reviewId = context.params.reviewId;

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return error('MISSING_REQUIRED', '用户ID和角色不能为空', undefined, 400);
    }

    const participant = await prisma.reviewParticipant.create({
      data: {
        review: { connect: { id: reviewId } },
        user: { connect: { id: userId } },
        role,
      },
    });

    return NextResponse.json(success(participant));
  } catch (err) {
    console.error('添加评审参与者失败:', err);
    return error('ADD_PARTICIPANT_FAILED', '添加评审参与者失败', undefined, 500);
  }
}

// DELETE /api/v1/reviews/[id]/participants/[participantId] - 移除评审参与者
export async function DELETE(request: NextRequest, context: any) {
  const reviewId = context.params.reviewId;
  const participantId = context.params.participantId;

  try {
    const existing = await prisma.reviewParticipant.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: participantId,
        },
      },
    });

    if (!existing) {
      return error('PARTICIPANT_NOT_FOUND', '参与者不存在', undefined, 404);
    }

    await prisma.reviewParticipant.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId: participantId,
        },
      },
    });

    return NextResponse.json(success({ message: '参与者已移除' }));
  } catch (err) {
    console.error('移除评审参与者失败:', err);
    return error('REMOVE_PARTICIPANT_FAILED', '移除评审参与者失败', undefined, 500);
  }
}
