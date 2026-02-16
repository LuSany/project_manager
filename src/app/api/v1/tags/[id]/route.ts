import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// DELETE /api/v1/tags/[id] - 删除标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // 验证标签是否存在
    const tag = await db.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            taskTags: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "标签不存在" },
        { status: 404 }
      );
    }

    // 删除标签（级联删除关联的TaskTag记录）
    await db.tag.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除标签失败:", error);
    return NextResponse.json(
      { success: false, error: "删除标签失败" },
      { status: 500 }
    );
  }
}
