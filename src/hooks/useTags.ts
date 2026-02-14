"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type {
  Tag,
  CreateTagRequest,
  TaskTagRequest,
  TagListResponse,
} from "@/types/tag"

// 查询键
export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
  list: () => [...tagKeys.lists()] as const,
}

/**
 * 获取所有标签
 */
export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: async () => {
      const response = await api.get<TagListResponse>("/tags/list")
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "获取标签列表失败")
      }
      return response.data
    },
  })
}

/**
 * 创建标签
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTagRequest) => {
      const response = await api.post<Tag>("/tags/create", data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "创建标签失败")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.list() })
    },
  })
}

/**
 * 删除标签
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagId: string) => {
      const response = await api.delete<Tag>(`/tags/${tagId}`)
      if (!response.success) {
        throw new Error(response.error?.message || "删除标签失败")
      }
      return tagId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.list() })
    },
  })
}

/**
 * 为任务添加标签
 */
export function useAddTaskTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: TaskTagRequest }) => {
      const response = await api.post(`/tasks/${taskId}/tags`, data)
      if (!response.success) {
        throw new Error(response.error?.message || "添加标签失败")
      }
      return response.data
    },
    onSuccess: () => {
      // 使任务相关查询失效
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

/**
 * 从任务移除标签
 */
export function useRemoveTaskTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      const response = await api.delete(`/tasks/${taskId}/tags/${tagId}`)
      if (!response.success) {
        throw new Error(response.error?.message || "移除标签失败")
      }
      return { taskId, tagId }
    },
    onSuccess: () => {
      // 使任务相关查询失效
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
