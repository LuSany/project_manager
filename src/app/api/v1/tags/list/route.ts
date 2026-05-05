import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request);
  if (!userId) return null;
  return db.users.findUnique({ where: { id: userId } });
}

// GET /api/v1/tags/list - 获取所有标签
export async function GET(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const tags = await db.tags.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            task_tags: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("获取标签列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签列表失败" },
      { status: 500 }
    );
  }
}
