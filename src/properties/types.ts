/**
 * Property 系统类型定义
 * 支持插件化的属性类型系统
 */

import { ComponentType } from 'react'

/**
 * 属性类型
 */
export type PropertyType =
  | 'text' // 文本
  | 'number' // 数字
  | 'select' // 单选
  | 'multiSelect' // 多选
  | 'date' // 日期
  | 'person' // 人员
  | 'multiPerson' // 多人
  | 'file' // 文件
  | 'checkbox' // 复选框
  | 'url' // 链接
  | 'email' // 邮箱
  | 'phone' // 电话
  | 'createdTime' // 创建时间
  | 'createdBy' // 创建人
  | 'updatedTime' // 更新时间
  | 'updatedBy' // 更新人

/**
 * 属性定义
 */
export interface Property {
  /** 唯一标识符 */
  id: string
  /** 属性类型 */
  type: PropertyType
  /** 属性名称 */
  name: string
  /** 选项列表 (select/multiSelect 用) */
  options?: SelectOption[]
  /** 日期格式 (date 用) */
  dateFormat?: string
  /** 是否占满宽度 */
  fullWidth?: boolean
  /** 是否只读 (系统属性) */
  readonly?: boolean
  /** 占位符提示 */
  placeholder?: string
  /** 是否必填 */
  required?: boolean
}

/**
 * 选择选项
 */
export interface SelectOption {
  /** 选项 ID */
  id: string
  /** 选项值 */
  value: string
  /** 选项颜色 */
  color?: string
}

/**
 * 属性值类型
 */
export type PropertyValue =
  | string // text, url, email, phone, createdTime, updatedTime
  | number // number
  | boolean // checkbox
  | string[] // multiSelect, multiPerson
  | SelectOption[] // select (单选时用数组)
  | null

/**
 * 属性值变更事件
 */
export interface PropertyValueChangeEvent {
  /** 属性 ID */
  propertyId: string
  /** 旧值 */
  oldValue: PropertyValue
  /** 新值 */
  newValue: PropertyValue
  /** 卡片 ID */
  cardId: string
}

/**
 * 属性验证器
 */
export type PropertyValidator = (value: PropertyValue) => {
  valid: boolean
  error?: string
}

/**
 * 属性序列化器
 */
export type PropertySerializer = (value: PropertyValue) => string

/**
 * 属性反序列化器
 */
export type PropertyDeserializer = (value: string) => PropertyValue

/**
 * 属性组件 Props
 */
export interface PropertyProps {
  /** 属性定义 */
  property: Property
  /** 当前值 */
  value: PropertyValue
  /** 值变更回调 */
  onChange: (value: PropertyValue) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 只读模式 */
  readonly?: boolean
}

/**
 * 属性组件配置
 */
export interface PropertyComponentConfig {
  /** React 组件 */
  component: ComponentType<PropertyProps>
  /** 验证器 */
  validator?: PropertyValidator
  /** 序列化器 */
  serializer?: PropertySerializer
  /** 反序列化器 */
  deserializer?: PropertyDeserializer
  /** 默认值工厂 */
  defaultValueFactory?: () => PropertyValue
}

/**
 * 属性注册表
 * 将属性类型映射到对应的组件配置
 */
export interface PropertyRegistry {
  [type: string]: PropertyComponentConfig
}

/**
 * 属性变更历史记录
 */
export interface PropertyChangeHistory {
  /** 记录 ID */
  id: string
  /** 时间戳 */
  timestamp: number
  /** 操作人 ID */
  userId: string
  /** 卡片 ID */
  cardId: string
  /** 属性 ID */
  propertyId: string
  /** 旧值 */
  oldValue: PropertyValue
  /** 新值 */
  newValue: PropertyValue
}

/**
 * 批量属性更新
 */
export interface BatchPropertyUpdate {
  /** 卡片 ID */
  cardId: string
  /** 属性更新映射 */
  updates: Record<string, PropertyValue>
}
