import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";

// GET /api/v1/users - 获取系统用户列表
export async function GET(req: NextRequest) {
  // 认证检查
  const userId = req.cookies.get("user-id")?.value;

  if (!userId) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const excludeProjectId = searchParams.get("excludeProjectId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    // 构建查询条件
    const where: any = {
      status: "ACTIVE", // 只显示已激活的用户
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // 如果指定了排除的项目ID，排除已经是该项目成员的用户
    if (excludeProjectId) {
      where.AND = [
        {
          NOT: {
            OR: [
              { ownedProjects: { some: { id: excludeProjectId } } },
              { projectMembers: { some: { projectId: excludeProjectId } } },
            ],
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          department: true,
          position: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return ApiResponder.success({
      data: users,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return ApiResponder.serverError("获取用户列表失败");
  }
}