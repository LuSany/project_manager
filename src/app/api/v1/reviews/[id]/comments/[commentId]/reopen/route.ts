import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

// POST /api/v1/reviews/[id]/comments/[commentId]/reopen - 重新打开评论
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

    // 检查权限：只有评论作者可以重新打开
    const isCommentAuthor = comment.authorId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isCommentAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only comment author can reopen" },
        { status: 403 }
      );
    }

    if (comment.status === "OPEN") {
      return NextResponse.json(
        { success: false, error: "Comment is already open" },
        { status: 400 }
      );
    }

    const updatedComment = await prisma.reviewComment.update({
      where: { id: commentId },
      data: { status: "OPEN" },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: "Comment reopened",
    });
  } catch (error) {
    console.error("Reopen comment failed:", error);
    return NextResponse.json(
      { success: false, error: "Reopen comment failed" },
      { status: 500 }
    );
  }
}