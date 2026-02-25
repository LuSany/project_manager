import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// Issue 关联需求验证 Schema
const linkRequirementSchema = z.object({
  requirementId: z.string().min(1, "需求 ID 不能为空"),
});

// POST /api/v1/issues/[id]/link-requirement - 关联需求
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

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
    const validatedData = linkRequirementSchema.parse(body);

    // 验证 Issue 是否存在
    const issue = await db.issue.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "问题不存在" },
        { status: 404 }
      );
    }

    // 验证需求是否存在
    const requirement = await db.requirement.findUnique({
      where: { id: validatedData.requirementId },
    });

    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    // 验证 Issue 和需求是否属于同一个项目
    if (issue.projectId !== requirement.projectId) {
      return NextResponse.json(
        { success: false, error: "问题和需求不属于同一个项目" },
        { status: 400 }
      );
    }

    // 权限检查：只有项目成员可以关联需求
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: issue.projectId,
          userId: user.id,
        },
      },
    });

    const isOwner = issue.project.ownerId === user.id;
    const isAdmin = membership?.role === 'PROJECT_ADMIN';
    const isProjectOwner = membership?.role === 'PROJECT_OWNER';
    const isMember = !!membership;

    if (!isOwner && !isAdmin && !isProjectOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: "无权限执行此操作" },
        { status: 403 }
      );
    }

    // 检查是否已经关联了需求
    if (issue.requirementId) {
      return NextResponse.json(
        { success: false, error: "该问题已经关联了需求" },
        { status: 400 }
      );
    }

    // 更新 Issue，关联需求
    const updatedIssue = await db.issue.update({
      where: { id },
      data: {
        requirementId: validatedData.requirementId,
      },
      include: {
        requirement: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: "问题已成功关联到需求",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("关联需求失败:", error);
    return NextResponse.json(
      { success: false, error: "关联需求失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/issues/[id]/link-requirement - 取消关联需求
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    // 验证 Issue 是否存在
    const issue = await db.issue.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "问题不存在" },
        { status: 404 }
      );
    }

    // 检查是否已经关联了需求
    if (!issue.requirementId) {
      return NextResponse.json(
        { success: false, error: "该问题未关联任何需求" },
        { status: 400 }
      );
    }

    // 权限检查
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: issue.projectId,
          userId: user.id,
        },
      },
    });

    const isOwner = issue.project.ownerId === user.id;
    const isAdmin = membership?.role === 'PROJECT_ADMIN';
    const isProjectOwner = membership?.role === 'PROJECT_OWNER';

    if (!isOwner && !isAdmin && !isProjectOwner) {
      return NextResponse.json(
        { success: false, error: "无权限执行此操作" },
        { status: 403 }
      );
    }

    // 取消关联
    const updatedIssue = await db.issue.update({
      where: { id },
      data: {
        requirementId: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: "已取消问题与需求的关联",
    });
  } catch (error) {
    console.error("取消关联需求失败:", error);
    return NextResponse.json(
      { success: false, error: "取消关联需求失败" },
      { status: 500 }
    );
  }
}
