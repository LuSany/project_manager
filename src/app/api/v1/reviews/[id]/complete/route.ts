import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

// POST /api/v1/reviews/[id]/complete - 结束评审
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

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: { include: { members: true } },
        participants: {
          where: { role: "REVIEWER" },
        },
        votes: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    // 检查是否是 MODERATOR 角色
    const moderator = review.participants.find(
      (p) => p.role === "MODERATOR" && p.userId === user.id
    );
    const isProjectOwner = review.project.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!moderator && !isProjectOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only MODERATOR can complete the review" },
        { status: 403 }
      );
    }

    // 检查评审状态
    if (review.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, error: "Review is not in progress" },
        { status: 400 }
      );
    }

    // 检查所有 REVIEWER 是否都已投票同意
    const reviewers = review.participants.filter((p) => p.role === "REVIEWER");
    const agreedVotes = review.votes.filter((v) => v.agreed === true);

    if (reviewers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No reviewers in this review" },
        { status: 400 }
      );
    }

    if (agreedVotes.length < reviewers.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Not all reviewers have agreed",
          data: {
            total: reviewers.length,
            agreed: agreedVotes.length,
            pending: reviewers.length - review.votes.length,
          },
        },
        { status: 400 }
      );
    }

    // 更新评审状态为已完成
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: "COMPLETED",
      },
      include: {
        type: true,
        author: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: "Review completed successfully",
    });
  } catch (error) {
    console.error("Complete review failed:", error);
    return NextResponse.json(
      { success: false, error: "Complete review failed" },
      { status: 500 }
    );
  }
}