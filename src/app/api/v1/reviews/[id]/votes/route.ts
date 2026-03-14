import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/v1/reviews/[id]/votes - 获取评审投票情况
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Please login first" },
      { status: 401 }
    );
  }

  const { id: reviewId } = await params;

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: { include: { members: true } },
        participants: {
          where: { role: "REVIEWER" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        votes: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    // 检查访问权限
    const isOwner = review.project.ownerId === user.id;
    const isMember = review.project.members.some((m) => m.userId === user.id);
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isMember && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "No access to this review" },
        { status: 403 }
      );
    }

    // 构建投票状态
    const voters = review.participants.map((participant) => {
      const vote = review.votes.find((v) => v.userId === participant.userId);
      return {
        user: participant.user,
        agreed: vote?.agreed ?? null,
        votedAt: vote?.votedAt ?? null,
      };
    });

    const agreedCount = voters.filter((v) => v.agreed === true).length;
    const totalReviewers = review.participants.length;
    const allAgreed = totalReviewers > 0 && agreedCount === totalReviewers;

    return NextResponse.json({
      success: true,
      data: {
        voters,
        summary: {
          total: totalReviewers,
          agreed: agreedCount,
          pending: totalReviewers - review.votes.length,
          allAgreed,
        },
      },
    });
  } catch (error) {
    console.error("Get votes failed:", error);
    return NextResponse.json(
      { success: false, error: "Get votes failed" },
      { status: 500 }
    );
  }
}

// POST /api/v1/reviews/[id]/votes - 提交投票
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Please login first" },
      { status: 401 }
    );
  }

  const { id: reviewId } = await params;
  const body = await request.json();
  const { agreed } = body;

  if (typeof agreed !== "boolean") {
    return NextResponse.json(
      { success: false, error: "agreed must be a boolean" },
      { status: 400 }
    );
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        participants: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    // 检查是否是 REVIEWER 角色
    const participant = review.participants.find(
      (p) => p.userId === user.id && p.role === "REVIEWER"
    );

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "Only REVIEWER can vote" },
        { status: 403 }
      );
    }

    // 创建或更新投票
    const vote = await prisma.reviewVote.upsert({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
      update: {
        agreed,
        votedAt: new Date(),
      },
      create: {
        reviewId,
        userId: user.id,
        agreed,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: vote,
      message: "Vote submitted",
    });
  } catch (error) {
    console.error("Submit vote failed:", error);
    return NextResponse.json(
      { success: false, error: "Submit vote failed" },
      { status: 500 }
    );
  }
}