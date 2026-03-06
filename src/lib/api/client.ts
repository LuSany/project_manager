"use client";

import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types/api";

const API_BASE = "/api/v1";

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      credentials: "include", // 确保包含 cookie
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return data as ApiResponse<T>;
    }

    return data as ApiResponse<T>;
  }

  // ========================================================================
  // GET请求
  // ========================================================================

  static async get<T>(
    endpoint: string,
    params?: PaginationParams
  ): Promise<ApiResponse<T>> {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";

    return this.request<T>(`${endpoint}${queryString}`);
  }

  // ========================================================================
  // POST请求
  // ========================================================================

  static async post<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // PUT请求
  // ========================================================================

  static async put<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // DELETE请求
  // ========================================================================

  static async delete<T>(
    endpoint: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

// 导出便捷方法
export const api = {
  get: <T>(url: string, params?: PaginationParams) =>
    ApiClient.get<T>(url, params),
  post: <T>(url: string, data?: unknown) =>
    ApiClient.post<T>(url, data),
  put: <T>(url: string, data?: unknown) =>
    ApiClient.put<T>(url, data),
  delete: <T>(url: string) => ApiClient.delete<T>(url),
};
