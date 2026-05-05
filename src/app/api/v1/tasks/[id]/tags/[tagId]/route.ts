import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request);
  if (!userId) return null;
  return prisma.users.findUnique({ where: { id: userId } });
}

// DELETE /api/v1/tasks/[id]/tags/[tagId] - 移除任务标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id: taskId, tagId } = await params;

    // 验证任务是否存在且用户有权限访问
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        projects: {
          project_members: {
            some: {
              userId: user.id
            }
          }
        }
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在或无权访问" },
        { status: 404 }
      );
    }

    // 验证标签是否存在
    const tag = await prisma.tags.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "标签不存在" },
        { status: 404 }
      );
    }

    // 检查关联是否存在
    const task_tags = await prisma.task_tags.findUnique({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
    });

    if (!task_tags) {
      return NextResponse.json(
        { success: false, error: "任务未关联该标签" },
        { status: 404 }
      );
    }

    // 删除关联
    await prisma.task_tags.delete({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "移除标签成功",
    });
  } catch (error) {
    console.error("移除任务标签失败:", error);
    return NextResponse.json(
      { success: false, error: "移除任务标签失败" },
      { status: 500 }
    );
  }
}
