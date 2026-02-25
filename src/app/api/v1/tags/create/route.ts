import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 标签创建验证 Schema
const createTagSchema = z.object({
  name: z.string().min(1, "标签名称不能为空"),
  color: z.string().optional(),
});

// POST /api/v1/tags/create - 创建标签
export async function POST(request: NextRequest) {
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
    const validatedData = createTagSchema.parse(body);

    // 检查标签名是否已存在
    const existingTag = await db.tag.findUnique({
      where: { name: validatedData.name },
    });

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: "标签名称已存在" },
        { status: 400 }
      );
    }

    const tag = await db.tag.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
      },
    });

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("创建标签失败:", error);
    return NextResponse.json(
      { success: false, error: "创建标签失败" },
      { status: 500 }
    );
  }
}
