import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiResponder } from "@/lib/api/response";
import type { TaskImportResult, TemplateTask } from "@/types/task-template";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 任务导入验证Schema
const templateTaskSchema = z.object({
  title: z.string().min(1, "任务标题不能为空"),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedHours: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
});

const importFromTemplateSchema = z.object({
  templateId: z.string().min(1, "模板ID不能为空"),
  projectId: z.string().min(1, "项目ID不能为空"),
  milestoneId: z.string().optional(),
});

const importFromJsonSchema = z.object({
  tasks: z.array(templateTaskSchema).min(1, "至少需要一个任务"),
  projectId: z.string().min(1, "项目ID不能为空"),
  milestoneId: z.string().optional(),
});

// 验证项目权限
async function validateProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return false;

  const isOwner = project.ownerId === userId;
  const isMember = project.members.some((m) => m.userId === userId);
  const isAdmin = (await db.user.findUnique({ where: { id: userId } }))?.role === 'ADMIN';

  return isOwner || isMember || isAdmin === true;
}

// 批量创建任务
async function createTasks(
  tasks: TemplateTask[],
  projectId: string,
  milestoneId: string | undefined,
  userId: string
): Promise<TaskImportResult> {
  const result: TaskImportResult = {
    created: 0,
    failed: 0,
    total: tasks.length,
    errors: [],
  };

  for (const task of tasks) {
    try {
      await db.task.create({
        data: {
          title: task.title,
          description: task.description,
          priority: task.priority === 'URGENT' ? 'CRITICAL' : task.priority ,
          estimatedHours: task.estimatedHours,
          startDate: task.startDate ? new Date(task.startDate) : null,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          status: 'TODO',
          progress: 0,
          projectId,
          milestoneId,
        },
      });
      result.created++;
    } catch (error) {
      result.failed++;
      result.errors?.push({
        task: task.title,
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  return result;
}

// POST /api/v1/tasks/import - 导入任务
export async function POST(request: NextRequest) {
  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return ApiResponder.unauthorized("未授权，请先登录");
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    
    // 处理文件上传 (Excel)
    if (contentType.includes('multipart/form-data')) {
      return await handleFileImport(request, user);
    }
    
    // 处理JSON导入
    const body = await request.json();
    
    // 判断是从模板导入还是直接从JSON导入
    if (body.templateId) {
      return await importFromTemplate(body, user);
    } else {
      return await importFromJson(body, user);
    }
  } catch (error) {
    console.error("导入任务失败:", error);
    return ApiResponder.serverError("导入任务失败");
  }
}

// 从模板导入任务
async function importFromTemplate(body: any, user: any) {
  const validatedData = importFromTemplateSchema.parse(body);

  // 验证项目权限
  const hasAccess = await validateProjectAccess(validatedData.projectId, user.id);
  if (!hasAccess) {
    return ApiResponder.forbidden("无权访问此项目");
  }

  // 获取模板
  const template = await db.taskTemplate.findUnique({
    where: { id: validatedData.templateId },
  });

  if (!template) {
    return ApiResponder.notFound("模板不存在");
  }

  // 解析模板数据
  const templateData = JSON.parse(template.templateData);
  const tasks: TemplateTask[] = (templateData.tasks || []) as TemplateTask[];

  if (tasks.length === 0) {
    return ApiResponder.validationError("模板中没有任务");
  }

  // 验证里程碑ID（如果提供）
  if (validatedData.milestoneId) {
    const milestone = await db.milestone.findUnique({
      where: { id: validatedData.milestoneId },
    });
    if (!milestone || milestone.projectId !== validatedData.projectId) {
      return ApiResponder.validationError("里程碑不存在或不属于该项目");
    }
  }

  // 批量创建任务
  const result = await createTasks(
    tasks,
    validatedData.projectId,
    validatedData.milestoneId,
    user.id
  );

  return ApiResponder.success(result, `导入完成：成功${result.created}个，失败${result.failed}个`);
}

// 从JSON导入任务
async function importFromJson(body: any, user: any) {
  const validatedData = importFromJsonSchema.parse(body);

  // 验证项目权限
  const hasAccess = await validateProjectAccess(validatedData.projectId, user.id);
  if (!hasAccess) {
    return ApiResponder.forbidden("无权访问此项目");
  }

  // 验证里程碑ID（如果提供）
  if (validatedData.milestoneId) {
    const milestone = await db.milestone.findUnique({
      where: { id: validatedData.milestoneId },
    });
    if (!milestone || milestone.projectId !== validatedData.projectId) {
      return ApiResponder.validationError("里程碑不存在或不属于该项目");
    }
  }

  // 批量创建任务
  const result = await createTasks(
    validatedData.tasks as TemplateTask[],
    validatedData.projectId,
    validatedData.milestoneId,
    user.id
  );

  return ApiResponder.success(result, `导入完成：成功${result.created}个，失败${result.failed}个`);
}

// 处理文件导入 (Excel)
async function handleFileImport(request: NextRequest, user: any) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const projectId = formData.get('projectId') as string;
  const milestoneId = formData.get('milestoneId') as string | null;

  if (!file) {
    return ApiResponder.validationError("未提供文件");
  }

  if (!projectId) {
    return ApiResponder.validationError("项目ID不能为空");
  }

  // 验证项目权限
  const hasAccess = await validateProjectAccess(projectId, user.id);
  if (!hasAccess) {
    return ApiResponder.forbidden("无权访问此项目");
  }

  // 检查文件类型
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.json')) {
    return ApiResponder.validationError("仅支持 .xlsx, .xls, .json 格式文件");
  }

  // 处理JSON文件
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      
      if (!Array.isArray(json.tasks) && !Array.isArray(json)) {
        return ApiResponder.validationError("JSON格式错误：需要 tasks 数组");
      }
      
      const tasks = Array.isArray(json) ? json : json.tasks;
      
      // 验证任务格式
      const validatedTasks = z.array(templateTaskSchema).parse(tasks);
      
      // 验证里程碑ID（如果提供）
      if (milestoneId) {
        const milestone = await db.milestone.findUnique({
          where: { id: milestoneId },
        });
        if (!milestone || milestone.projectId !== projectId) {
          return ApiResponder.validationError("里程碑不存在或不属于该项目");
        }
      }
      
      const result = await createTasks(validatedTasks as TemplateTask[], projectId, milestoneId || undefined, user.id);
      return ApiResponder.success(result, `导入完成：成功${result.created}个，失败${result.failed}个`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiResponder.validationError("JSON数据验证失败", error.format() as any);
      }
      return ApiResponder.validationError("JSON解析失败");
    }
  }

  // Excel文件需要xlsx库处理
  // 由于当前项目没有安装xlsx，返回提示信息
  return ApiResponder.validationError("Excel导入功能需要安装xlsx库，请使用JSON格式导入或联系管理员");
}
