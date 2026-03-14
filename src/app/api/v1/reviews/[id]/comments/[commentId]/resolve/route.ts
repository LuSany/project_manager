import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { notifyCommentResolved } from "@/lib/notification";

// POST /api/v1/reviews/[id]/comments/[commentId]/resolve - 标记评论已解决
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Please login first" },
      { status: 401 }
    );
  }

  const { id: reviewId, commentId } = await params;

  try {
    const comment = await prisma.reviewComment.findUnique({
      where: { id: commentId },
      include: {
        review: {
          include: {
            project: { include: { members: true } }
          }
        }
      },
    });

    if (!comment || comment.reviewId !== reviewId) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    // 检查权限：评论作者、评审作者或管理员可以标记已解决
    const isCommentAuthor = comment.authorId === user.id;
    const isReviewAuthor = comment.review.authorId === user.id;
    const isProjectOwner = comment.review.project.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isCommentAuthor && !isReviewAuthor && !isProjectOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "No permission to resolve this comment" },
        { status: 403 }
      );
    }

    if (comment.status === "RESOLVED") {
      return NextResponse.json(
        { success: false, error: "Comment is already resolved" },
        { status: 400 }
      );
    }

    const updatedComment = await prisma.reviewComment.update({
      where: { id: commentId },
      data: { status: "RESOLVED" },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // 发送通知给评论作者
    try {
      if (comment.authorId !== user.id) {
        await notifyCommentResolved(
          comment.authorId,
          comment.review.title,
          comment.review.projectId
        );
      }
    } catch (notifyError) {
      console.error("Failed to send notification:", notifyError);
    }

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: "Comment resolved",
    });
  } catch (error) {
    console.error("Resolve comment failed:", error);
    return NextResponse.json(
      { success: false, error: "Resolve comment failed" },
      { status: 500 }
    );
  }
}