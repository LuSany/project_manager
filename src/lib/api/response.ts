import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export class ApiResponder {
  /**
   * 成功响应
   */
  static success<T>(
    data: T,
    message?: string,
    status: number = 200
  ): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      ...(message && { message }),
    }, { status });
  }

  /**
   * 创建成功响应（201）
   */
  static created<T>(
    data: T,
    message: string = "创建成功"
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, 201);
  }

  /**
   * 错误响应
   */
  static error(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    status: number = 400
  ): NextResponse<ApiResponse<null>> {
    return NextResponse.json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    }, { status });
  }

  /**
   * 未授权错误
   */
  static unauthorized(message: string = "未授权访问"): NextResponse<ApiResponse<null>> {
    return this.error("UNAUTHORIZED", message, undefined, 401);
  }

  /**
   * 禁止访问
   */
  static forbidden(message: string = "无权访问此资源"): NextResponse<ApiResponse<null>> {
    return this.error("FORBIDDEN", message, undefined, 403);
  }

  /**
   * 资源未找到
   */
  static notFound(message: string = "请求的资源不存在"): NextResponse<ApiResponse<null>> {
    return this.error("NOT_FOUND", message, undefined, 404);
  }

  /**
   * 服务器错误
   */
  static serverError(message: string = "服务器内部错误"): NextResponse<ApiResponse<null>> {
    return this.error("INTERNAL_ERROR", message, undefined, 500);
  }

  /**
   * 验证错误
   */
  static validationError(
    message: string,
    details?: Record<string, unknown>
  ): NextResponse<ApiResponse<null>> {
    return this.error("VALIDATION_ERROR", message, details, 400);
  }
}
