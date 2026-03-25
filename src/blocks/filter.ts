/**
 * Filter 筛选系统
 * 支持嵌套的复杂筛选逻辑
 */

import type { PropertyType, PropertyValue } from '../properties/types'

/**
 * 筛选条件类型
 */
export type FilterCondition =
  | 'is' // 等于
  | 'isNot' // 不等于
  | 'contains' // 包含
  | 'notContains' // 不包含
  | 'isEmpty' // 为空
  | 'isNotEmpty' // 不为空
  | 'before' // 早于 (日期)
  | 'after' // 晚于 (日期)
  | 'greaterThan' // 大于 (数字)
  | 'lessThan' // 小于 (数字)
  | 'greaterThanOrEqual' // 大于等于 (数字)
  | 'lessThanOrEqual' // 小于等于 (数字)

/**
 * 筛选器
 */
export interface Filter {
  /** 属性 ID */
  propertyId: string
  /** 筛选条件 */
  condition: FilterCondition
  /** 筛选值 */
  value: any
}

/**
 * 筛选组
 */
export interface FilterGroup {
  /** 筛选器列表 */
  filters: Filter[]
  /** 逻辑运算符 */
  operator: 'and' | 'or'
  /** 嵌套筛选组 */
  groups?: FilterGroup[]
}

/**
 * 筛选上下文
 */
export interface FilterContext {
  /** 卡片属性 */
  properties: Record<string, PropertyValue>
  /** 属性类型映射 */
  propertyTypes: Map<string, PropertyType>
}

/**
 * 筛选结果
 */
export interface FilterResult {
  /** 是否通过筛选 */
  passed: boolean
  /** 失败的筛选器列表 */
  failedFilters: Filter[]
}

/**
 * 检查单个筛选器
 */
export function checkFilter(filter: Filter, context: FilterContext): boolean {
  const value = context.properties[filter.propertyId]
  const propertyType = context.propertyTypes.get(filter.propertyId)

  if (propertyType === undefined) {
    return false
  }

  switch (filter.condition) {
    case 'isEmpty':
      return (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      )

    case 'isNotEmpty':
      return (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0)
      )

    case 'is':
      return value === filter.value

    case 'isNot':
      return value !== filter.value

    case 'contains':
      if (typeof value === 'string') {
        return value.toLowerCase().includes(String(filter.value).toLowerCase())
      }
      if (Array.isArray(value)) {
        return value.some((v) => v === filter.value)
      }
      return false

    case 'notContains':
      if (typeof value === 'string') {
        return !value.toLowerCase().includes(String(filter.value).toLowerCase())
      }
      if (Array.isArray(value)) {
        return !value.some((v) => v === filter.value)
      }
      return true

    case 'before':
      if (typeof value === 'number' && typeof filter.value === 'number') {
        return value < filter.value
      }
      return false

    case 'after':
      if (typeof value === 'number' && typeof filter.value === 'number') {
        return value > filter.value
      }
      return false

    case 'greaterThan':
      if (typeof value === 'number' && typeof filter.value === 'number') {
        return value > filter.value
      }
      return false

    case 'lessThan':
      if (typeof value === 'number' && typeof filter.value === 'number') {
        return value < filter.value
      }
      return false

    case 'greaterThanOrEqual':
      if (typeof value === 'number' && typeof filter.value === 'number') {
        return value >= filter.value
      }
      return false

    case 'lessThanOrEqual':
      if (typeof value === 'number' && typeof filter.value === 'number') {
        return value <= filter.value
      }
      return false

    default:
      return false
  }
}

/**
 * 检查筛选组
 */
export function checkFilterGroup(filterGroup: FilterGroup, context: FilterContext): FilterResult {
  const failedFilters: Filter[] = []

  for (const filter of filterGroup.filters) {
    const passed = checkFilter(filter, context)
    if (!passed) {
      failedFilters.push(filter)
    }

    if (filterGroup.operator === 'and' && !passed) {
      return { passed: false, failedFilters }
    }
    if (filterGroup.operator === 'or' && passed) {
      return { passed: true, failedFilters: [] }
    }
  }

  if (filterGroup.groups) {
    for (const group of filterGroup.groups) {
      const result = checkFilterGroup(group, context)
      if (filterGroup.operator === 'and' && !result.passed) {
        return result
      }
      if (filterGroup.operator === 'or' && result.passed) {
        return result
      }
    }
  }

  return { passed: true, failedFilters }
}

/**
 * 创建空筛选组
 */
export function createEmptyFilterGroup(): FilterGroup {
  return {
    filters: [],
    operator: 'and',
    groups: [],
  }
}

/**
 * 合并筛选组
 */
export function mergeFilterGroups(...groups: FilterGroup[]): FilterGroup {
  return {
    filters: groups.flatMap((g) => g.filters),
    operator: 'and',
    groups: groups.flatMap((g) => g.groups || []),
  }
}

/**
 * 验证筛选器
 */
export function validateFilter(filter: Filter, propertyType: PropertyType): boolean {
  switch (filter.condition) {
    case 'isEmpty':
    case 'isNotEmpty':
      return true

    case 'before':
    case 'after':
      return propertyType === 'date' || propertyType === 'number'

    case 'greaterThan':
    case 'lessThan':
    case 'greaterThanOrEqual':
    case 'lessThanOrEqual':
      return propertyType === 'number'

    case 'is':
    case 'isNot':
      return true

    case 'contains':
    case 'notContains':
      return (
        ['text', 'url', 'email', 'phone'].includes(propertyType) ||
        propertyType === 'multiSelect' ||
        propertyType === 'multiPerson'
      )

    default:
      return false
  }
}

/**
 * 获取可用的筛选条件
 */
export function getAvailableConditions(propertyType: PropertyType): FilterCondition[] {
  const commonConditions: FilterCondition[] = ['is', 'isNot', 'isEmpty', 'isNotEmpty']

  switch (propertyType) {
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return [...commonConditions, 'contains', 'notContains']

    case 'number':
      return [
        ...commonConditions,
        'greaterThan',
        'lessThan',
        'greaterThanOrEqual',
        'lessThanOrEqual',
      ]

    case 'date':
      return [...commonConditions, 'before', 'after']

    case 'select':
      return ['is', 'isNot', 'isEmpty', 'isNotEmpty']

    case 'multiSelect':
    case 'multiPerson':
      return ['is', 'isNot', 'isEmpty', 'isNotEmpty', 'contains', 'notContains']

    case 'checkbox':
      return ['is', 'isNot']

    default:
      return commonConditions
  }
}
