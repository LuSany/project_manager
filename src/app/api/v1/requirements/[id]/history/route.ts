import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: requirementId } = await context.params;

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
      orderBy: { createdAt: "desc" },
    });

    // 获取变更用户信息
    const userIds = [...new Set(history.map(h => h.changedBy))]
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    const historyWithUser = history.map(h => ({
      ...h,
      changedByUser: userMap[h.changedBy] || null,
    }))

    return NextResponse.json({
      success: true,
      data: historyWithUser,
    });
  } catch (error) {
    console.error("获取需求变更历史失败:", error);
    return NextResponse.json(
      { success: false, error: "获取变更历史失败" },
      { status: 500 }
    );
  }
}
