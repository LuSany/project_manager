import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// Issue 翻转验证 Schema
const resolveIssueSchema = z.object({
  action: z.enum(["resolve", "reopen"]).default("resolve"),
  reason: z.string().optional(),
});

// POST /api/v1/issues/[id]/resolve - 解决问题/重新打开
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
    const validatedData = resolveIssueSchema.parse(body);

    // 验证 Issue 是否存在
    const existingIssue = await db.issue.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!existingIssue) {
      return NextResponse.json(
        { success: false, error: "问题不存在" },
        { status: 404 }
      );
    }

    // 权限检查：只有项目所有者或项目管理员可以解决/重新打开 Issue
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: existingIssue.projectId,
          userId: user.id,
        },
      },
    });

    const isOwner = existingIssue.project.ownerId === user.id;
    const isAdmin = membership?.role === 'PROJECT_ADMIN';
    const isProjectOwner = membership?.role === 'PROJECT_OWNER';

    if (!isOwner && !isAdmin && !isProjectOwner) {
      return NextResponse.json(
        { success: false, error: "无权限执行此操作" },
        { status: 403 }
      );
    }

    let updatedIssue;

    if (validatedData.action === "resolve") {
      // 解决问题
      if (existingIssue.status === 'RESOLVED' || existingIssue.status === 'CLOSED') {
        return NextResponse.json(
          { success: false, error: "该问题已经解决或关闭" },
          { status: 400 }
        );
      }

      updatedIssue = await db.issue.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
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

      // 如果 autoClose 为 true，自动关闭关联的任务
      if (existingIssue.autoClose) {
        await db.task.updateMany({
          where: {
            issueId: id,
            status: { not: 'DONE' },
          },
          data: {
            status: 'DONE',
            completedAt: new Date(),
          },
        });
      }
    } else {
      // 重新打开 Issue
      if (existingIssue.status !== 'RESOLVED' && existingIssue.status !== 'CLOSED') {
        return NextResponse.json(
          { success: false, error: "该问题当前不是解决或关闭状态" },
          { status: 400 }
        );
      }

      updatedIssue = await db.issue.update({
        where: { id },
        data: {
          status: 'REOPENED',
          resolvedAt: null,
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
    }

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: validatedData.action === "resolve" ? "问题已解决" : "问题已重新打开",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Issue 状态翻转失败:", error);
    return NextResponse.json(
      { success: false, error: "Issue 状态翻转失败" },
      { status: 500 }
    );
  }
}
