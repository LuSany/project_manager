import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 更新讨论验证 Schema
const updateDiscussionSchema = z.object({
  content: z.string().min(1, "讨论内容不能为空").optional(),
});

// GET /api/v1/requirements/[id]/discussions/[discussionId] - 获取讨论详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id: requirementId, discussionId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const discussion = await db.requirementDiscussion.findUnique({
      where: { id: discussionId, requirementId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: "讨论不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: discussion,
    });
  } catch (error) {
    console.error("获取需求讨论详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取需求讨论详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/requirements/[id]/discussions/[discussionId] - 更新讨论
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id: requirementId, discussionId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = updateDiscussionSchema.parse(body);

    // 验证讨论是否存在
    const existingDiscussion = await db.requirementDiscussion.findUnique({
      where: { id: discussionId },
    });

    if (!existingDiscussion) {
      return NextResponse.json(
        { success: false, error: "讨论不存在" },
        { status: 404 }
      );
    }

    // 权限检查：只有作者可以修改
    if (existingDiscussion.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "无权限修改此讨论" },
        { status: 403 }
      );
    }

    const discussion = await db.requirementDiscussion.update({
      where: { id: discussionId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: discussion,
      message: "讨论已更新",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("更新需求讨论失败:", error);
    return NextResponse.json(
      { success: false, error: "更新需求讨论失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/requirements/[id]/discussions/[discussionId] - 删除讨论
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id: requirementId, discussionId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    // 验证讨论是否存在
    const existingDiscussion = await db.requirementDiscussion.findUnique({
      where: { id: discussionId },
    });

    if (!existingDiscussion) {
      return NextResponse.json(
        { success: false, error: "讨论不存在" },
        { status: 404 }
      );
    }

    // 权限检查：只有作者或管理员可以删除
    if (existingDiscussion.userId !== user.id) {
      // 检查是否为项目管理员
      const requirement = await db.requirement.findUnique({
        where: { id: requirementId },
        include: {
          project: true,
        },
      });

      if (requirement) {
        const membership = await db.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: requirement.project.id,
              userId: user.id,
            },
          },
        });

        const isOwner = requirement.project.ownerId === user.id;
        const isAdmin = membership?.role === 'PROJECT_ADMIN';

        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            { success: false, error: "无权限删除此讨论" },
            { status: 403 }
          );
        }
      }
    }

    await db.requirementDiscussion.delete({
      where: { id: discussionId },
    });

    return NextResponse.json({
      success: true,
      message: "讨论已删除",
    });
  } catch (error) {
    console.error("删除需求讨论失败:", error);
    return NextResponse.json(
      { success: false, error: "删除需求讨论失败" },
      { status: 500 }
    );
  }
}
