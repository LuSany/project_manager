import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// GET /api/v1/requirements/[id]/history - 获取需求变更历史
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: requirementId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const history = await db.requirementHistory.findMany({
      where: { requirementId },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("获取需求变更历史失败:", error);
    return NextResponse.json(
      { success: false, error: "获取需求变更历史失败" },
      { status: 500 }
    );
  }
}
