import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.users.findUnique({ where: { id: userId } });
}

// GET: 获取任务的评论列表
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    // 检查任务是否存在
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // TODO: 当 task_comments 表创建后，从数据库获取评论
    // 目前返回空数组作为占位符
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("获取评论列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取评论列表失败" },
      { status: 500 }
    );
  }
}

// POST: 创建新评论
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await context.params;

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
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "评论内容不能为空" },
        { status: 400 }
      );
    }

    // 检查任务是否存在
    const task = await db.tasks.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // TODO: 当 task_comments 表创建后，保存评论到数据库
    // 目前返回模拟的评论对象
    const newComment = {
      id: `comment-${Date.now()}`,
      content: content.trim(),
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    console.error("创建评论失败:", error);
    return NextResponse.json(
      { success: false, error: "创建评论失败" },
      { status: 500 }
    );
  }
}