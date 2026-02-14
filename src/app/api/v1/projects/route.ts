import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponder } from "@/lib/api/response";
import type { AuthenticatedRequest } from "@/middleware";

// 项目请求验证Schema
const projectSchema = z.object({
  name: z.string().min(2, "项目名称至少2位").max(100, "项目名称最多100位"),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req;
    const page = parseInt(searchParams.page || "1");
    const pageSize = parseInt(searchParams.pageSize || "10");
    const status = searchParams.status as any;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    // 获取总数
    const total = await prisma.project.count({ where });

    // 获取项目列表
    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
        },
      },
    });

    return ApiResponder.success({
      items: projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("获取项目列表错误:", error);
    return ApiResponder.serverError("获取项目列表失败");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return ApiResponder.unauthorized("未授权访问");
    }

    const body = await req.json();
    const validatedData = projectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        status: "PLANNING",
        ownerId: user.id,
      },
    });

    return ApiResponder.created({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
    }, "项目创建成功");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError(
        "请求数据验证失败",
        error.issues as any
      );
    }
    console.error("创建项目错误:", error);
    return ApiResponder.serverError("创建项目失败");
  }
}
