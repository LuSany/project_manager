/**
 * Block 类型定义
 * 参考 Focalboard 的统一数据抽象设计
 */

/**
 * 基础 Block 接口
 * 所有实体（Board、Card、View）都继承自此
 */
export interface Block {
  /** 唯一标识符 */
  id: string
  /** 工作空间 ID */
  workspaceId: string
  /** 创建者 ID */
  createdBy: string
  /** 创建时间戳 */
  createAt: number
  /** 更新时间戳 */
  updateAt: number
  /** 软删除时间戳 */
  deletedAt?: number
}

/**
 * 看板 Block 类型
 */
export interface Board extends Block {
  type: 'board'
  fields: BoardFields
}

/**
 * 看板字段
 */
export interface BoardFields {
  /** 看板标题 */
  title: string
  /** 看板描述 */
  description?: string
  /** 看板图标 */
  icon?: string
  /** 卡片属性定义 */
  cardProperties: Property[]
  /** 默认视图 ID */
  defaultViewId?: string
  /** 是否显示描述 */
  showDescription?: boolean
  /** 是否公开 */
  isPublic?: boolean
}

/**
 * 任务/卡片 Block 类型
 */
export interface Card extends Block {
  type: 'card'
  fields: CardFields
  boardId?: string
}

/**
 * 卡片字段
 */
export interface CardFields {
  /** 卡片标题 */
  title: string
  /** 富文本内容 */
  content?: JSON
  /** 属性值键值对 */
  properties: Record<string, PropertyValue>
  /** 父级 ID（用于层级结构） */
  parentId?: string
  /** 负责人 ID 列表 */
  assignees?: string[]
  /** 截止日期 */
  dueDate?: number
  /** 标签 ID 列表 */
  labels?: string[]
}

/**
 * 视图 Block 类型
 */
export interface View extends Block {
  type: 'view'
  fields: ViewFields
}

/**
 * 视图类型
 */
export type ViewType = 'board' | 'table' | 'gallery' | 'calendar'

/**
 * 视图字段
 */
export interface ViewFields {
  /** 视图类型 */
  viewType: ViewType
  /** 视图标题 */
  title: string
  /** 分组依据的属性 ID */
  groupById?: string
  /** 日期显示属性 ID */
  dateDisplayPropertyId?: string
  /** 排序选项 */
  sortOptions: SortOption[]
  /** 可见属性 ID 列表 */
  visiblePropertyIds: string[]
  /** 筛选条件 */
  filter: FilterGroup
  /** 卡片顺序 */
  cardOrder: string[]
  /** 列宽度配置 */
  columnWidths: Record<string, number>
}

/**
 * 排序选项
 */
export interface SortOption {
  /** 属性 ID */
  propertyId: string
  /** 是否升序 */
  ascending: boolean
}

/**
 * 属性引用（用于 BoardFields.cardProperties）
 */
export interface Property {
  id: string
  type: PropertyType
  name: string
  options?: SelectOption[]
  dateFormat?: string
  fullWidth?: boolean
}

/**
 * 属性类型
 */
export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'person'
  | 'multiPerson'
  | 'file'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'createdTime'
  | 'createdBy'
  | 'updatedTime'
  | 'updatedBy'

/**
 * 选择选项
 */
export interface SelectOption {
  id: string
  value: string
  color?: string
}

/**
 * 属性值类型
 */
export type PropertyValue = string | number | boolean | string[] | SelectOption[] | null

/**
 * 筛选条件类型
 */
export type FilterCondition =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'notContains'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'before'
  | 'after'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'

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
 * 视图状态
 */
export interface ViewState {
  /** 滚动位置 */
  scrollPosition?: number
  /** 展开的卡片 ID */
  expandedCardIds?: string[]
  /** 自定义配置 */
  customConfig?: Record<string, any>
}

/**
 * Block 工厂类型（用于类型守卫）
 */
export type BlockType = 'board' | 'card' | 'view'

/**
 * 类型守卫：判断是否为 Board
 */
export function isBoard(block: Block): block is Board {
  return 'type' in block && (block as any).type === 'board'
}

/**
 * 类型守卫：判断是否为 Card
 */
export function isCard(block: Block): block is Card {
  return 'type' in block && (block as any).type === 'card'
}

/**
 * 类型守卫：判断是否为 View
 */
export function isView(block: Block): block is View {
  return 'type' in block && (block as any).type === 'view'
}
