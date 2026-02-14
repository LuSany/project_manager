// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// 创建标签请求
export interface CreateTagRequest {
  name: string;
  color: string;
}

// 任务标签关联请求
export interface TaskTagRequest {
  tagIds: string[];
}

// 标签列表响应
export type TagListResponse = Tag[];
