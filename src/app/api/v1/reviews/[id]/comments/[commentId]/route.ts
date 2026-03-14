import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

// PUT /api/v1/reviews/[id]/comments/[commentId] - 编辑评论
export async function PUT(
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
  const body = await request.json();
  const { content } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Content cannot be empty" },
      { status: 400 }
    );
  }

  try {
    const comment = await prisma.reviewComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.reviewId !== reviewId) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.authorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Only comment author can edit" },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.reviewComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        material: { select: { id: true, fileName: true } },
        item: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: "Comment updated",
    });
  } catch (error) {
    console.error("Update comment failed:", error);
    return NextResponse.json(
      { success: false, error: "Update comment failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/reviews/[id]/comments/[commentId] - 删除评论
export async function DELETE(
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
            project: true,
          },
        },
      },
    });

    if (!comment || comment.reviewId !== reviewId) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    const isAuthor = comment.authorId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only author or admin can delete" },
        { status: 403 }
      );
    }

    await prisma.reviewComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      data: { id: commentId },
      message: "Comment deleted",
    });
  } catch (error) {
    console.error("Delete comment failed:", error);
    return NextResponse.json(
      { success: false, error: "Delete comment failed" },
      { status: 500 }
    );
  }
}