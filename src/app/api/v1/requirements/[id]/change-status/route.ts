import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request);
  if (!userId) return null;
  return db.users.findUnique({ where: { id: userId } });
}

// 状态变更验证 Schema
const changeStatusSchema = z.object({
  toStatus: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "SCHEDULED", "IN_PROGRESS", "TESTING", "ACCEPTANCE", "COMPLETED", "CANCELLED"]),
  comment: z.string().optional(),
});

// POST /api/v1/requirements/[id]/change-status - 变更需求状态
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
    const validatedData = changeStatusSchema.parse(body);

    // 获取需求
    const requirement = await db.requirements.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            project_members: { where: { userId: user.id } },
          },
        },
      },
    });

    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    // 权限检查
    const isProjectMember = requirement.projects.ownerId === user.id ||
      requirement.projects.project_members.length > 0 ||
      user.role === 'ADMIN';

    if (!isProjectMember) {
      return NextResponse.json(
        { success: false, error: "无权修改此需求" },
        { status: 403 }
      );
    }

    const oldStatus = requirement.status;
    const newStatus = validatedData.toStatus;

    // 更新需求和记录历史
    const [updatedRequirement] = await Promise.all([
      db.requirements.update({
        where: { id },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
        include: {
          projects: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          reporter: { select: { id: true, name: true, avatar: true } },
        },
      }),
      db.requirement_history.create({
        data: {
          id: crypto.randomUUID(),
          requirementId: id,
          changeType: 'STATUS_CHANGE',
          oldValue: oldStatus,
          newValue: newStatus,
          changedBy: user.id,
          changeReason: validatedData.comment || `状态从 ${oldStatus} 变更为 ${newStatus}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedRequirement,
      message: `需求状态已从 ${oldStatus} 变更为 ${newStatus}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("变更需求状态失败:", error);
    return NextResponse.json(
      { success: false, error: "变更需求状态失败" },
      { status: 500 }
    );
  }
}