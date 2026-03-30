// ============================================================================
// 搜索相关类型定义
// ============================================================================

/**
 * 可搜索的实体类型
 */
export enum SearchType {
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  REQUIREMENT = 'REQUIREMENT',
  ISSUE = 'ISSUE',
  RISK = 'RISK',
  USER = 'USER',
}

/**
 * 搜索结果项 - 所有搜索实体的通用字段
 */
export interface SearchResultItem {
  id: string
  type: SearchType
  title: string
  description?: string
  status?: string
  url: string
  createdAt: string
}

/**
 * 按类型分组的搜索结果
 */
export interface SearchResult {
  results: Partial<Record<SearchType, SearchResultItem[]>>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 搜索参数
 */
export interface SearchParams {
  query: string
  types?: SearchType[]
  page?: number
  pageSize?: number
}
