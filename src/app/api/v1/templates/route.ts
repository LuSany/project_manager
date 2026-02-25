import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiResponder } from "@/lib/api/response";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 模板创建验证Schema
const createTemplateSchema = z.object({
  title: z.string().min(1, "模板标题不能为空"),
  description: z.string().optional(),
  templateData: z.record(z.string(), z.any()).refine((val) => {
    try {
      JSON.stringify(val);
      return true;
    } catch {
      return false;
    }
  }, "templateData必须是有效的JSON对象"),
  isPublic: z.boolean().optional().default(false),
});

// 模板更新验证Schema
const updateTemplateSchema = z.object({
  title: z.string().min(1, "模板标题不能为空").optional(),
  description: z.string().optional(),
  templateData: z.record(z.string(), z.any()).refine((val) => {
    try {
      JSON.stringify(val);
      return true;
    } catch {
      return false;
    }
  }, "templateData必须是有效的JSON对象").optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/v1/templates - 获取模板列表（支持分页）
export async function GET(req: NextRequest) {
  // 认证检查
  const user = await getAuthUser(req);
  if (!user) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const isPublic = searchParams.get("isPublic");

    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (isPublic === "true") {
      where.isPublic = true;
    }

    const [templates, total] = await Promise.all([
      db.taskTemplate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.taskTemplate.count({ where }),
    ]);

    // 将templateData从JSON字符串解析为对象
    const templatesWithData = templates.map((template) => ({
      ...template,
      templateData: JSON.parse(template.templateData),
    }));

    return ApiResponder.success({
      items: templatesWithData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("获取模板列表失败:", error);
    return ApiResponder.serverError("获取模板列表失败");
  }
}

// POST /api/v1/templates - 创建模板
export async function POST(req: NextRequest) {
  // 认证检查
  const user = await getAuthUser(req);
  if (!user) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    const body = await req.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await db.taskTemplate.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        templateData: JSON.stringify(validatedData.templateData),
        isPublic: validatedData.isPublic,
      },
    });

    return ApiResponder.created(
      {
        ...template,
        templateData: JSON.parse(template.templateData),
      },
      "模板创建成功"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponder.validationError(
        "请求数据验证失败",
        error.format() as any
      );
    }
    console.error("创建模板失败:", error);
    return ApiResponder.serverError("创建模板失败");
  }
}
