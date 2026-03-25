/**
 * Property 系统类型测试
 * 测试属性类型、属性定义和注册表
 */

import { describe, it, expect } from 'vitest'
import type {
  PropertyType,
  Property,
  PropertyValue,
  PropertyValidator,
  PropertySerializer,
  PropertyRegistry,
  SelectOption,
} from '../types'

describe('Property Types', () => {
  describe('PropertyType', () => {
    it('should support all property types', () => {
      const types: PropertyType[] = [
        'text',
        'number',
        'select',
        'multiSelect',
        'date',
        'person',
        'multiPerson',
        'file',
        'checkbox',
        'url',
        'email',
        'phone',
        'createdTime',
        'createdBy',
        'updatedTime',
        'updatedBy',
      ]
      expect(types).toHaveLength(16)
    })

    it('should have distinct type values', () => {
      const types: PropertyType[] = [
        'text',
        'number',
        'select',
        'multiSelect',
        'date',
        'person',
        'multiPerson',
        'file',
        'checkbox',
        'url',
        'email',
        'phone',
        'createdTime',
        'createdBy',
        'updatedTime',
        'updatedBy',
      ]
      const uniqueTypes = new Set(types)
      expect(uniqueTypes.size).toBe(types.length)
    })
  })

  describe('Property', () => {
    it('should create text property', () => {
      const prop: Property = {
        id: 'prop-1',
        type: 'text',
        name: 'Task Name',
      }
      expect(prop.type).toBe('text')
      expect(prop.id).toBe('prop-1')
      expect(prop.name).toBe('Task Name')
    })

    it('should create select property with options', () => {
      const options: SelectOption[] = [
        { id: 'opt-1', value: 'Todo', color: 'blue' },
        { id: 'opt-2', value: 'In Progress', color: 'yellow' },
        { id: 'opt-3', value: 'Done', color: 'green' },
      ]
      const prop: Property = {
        id: 'prop-2',
        type: 'select',
        name: 'Status',
        options,
      }
      expect(prop.type).toBe('select')
      expect(prop.options).toHaveLength(3)
      expect(prop.options?.[0].value).toBe('Todo')
      expect(prop.options?.[0].color).toBe('blue')
    })

    it('should create date property with format', () => {
      const prop: Property = {
        id: 'prop-3',
        type: 'date',
        name: 'Due Date',
        dateFormat: 'YYYY-MM-DD',
      }
      expect(prop.type).toBe('date')
      expect(prop.dateFormat).toBe('YYYY-MM-DD')
    })

    it('should support optional property fields', () => {
      const prop: Property = {
        id: 'prop-4',
        type: 'text',
        name: 'Description',
        fullWidth: true,
        readonly: false,
        placeholder: 'Enter description...',
        required: true,
      }
      expect(prop.fullWidth).toBe(true)
      expect(prop.readonly).toBe(false)
      expect(prop.placeholder).toBe('Enter description...')
      expect(prop.required).toBe(true)
    })

    it('should support readonly system properties', () => {
      const prop: Property = {
        id: 'prop-created-time',
        type: 'createdTime',
        name: 'Created Time',
        readonly: true,
      }
      expect(prop.readonly).toBe(true)
      expect(prop.type).toBe('createdTime')
    })
  })

  describe('PropertyValue', () => {
    it('should support string values', () => {
      const value: PropertyValue = 'Hello World'
      expect(value).toBe('Hello World')
    })

    it('should support number values', () => {
      const value: PropertyValue = 42
      expect(value).toBe(42)
    })

    it('should support boolean values', () => {
      const value: PropertyValue = true
      expect(value).toBe(true)
    })

    it('should support array values', () => {
      const value: PropertyValue = ['item1', 'item2', 'item3']
      expect(value).toHaveLength(3)
      expect(value[0]).toBe('item1')
    })

    it('should support null values', () => {
      const value: PropertyValue = null
      expect(value).toBeNull()
    })

    it('should support SelectOption array values', () => {
      const options: SelectOption[] = [{ id: 'opt-1', value: 'Done' }]
      const value: PropertyValue = options
      expect(Array.isArray(value)).toBe(true)
      expect(value).toHaveLength(1)
    })
  })

  describe('PropertyValidator', () => {
    it('should validate string property', () => {
      const validator: PropertyValidator = (value) => {
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a string' }
        }
        if (value.length === 0) {
          return { valid: false, error: 'Value cannot be empty' }
        }
        return { valid: true }
      }

      expect(validator('valid').valid).toBe(true)
      expect(validator('').valid).toBe(false)
      expect(validator('').error).toBe('Value cannot be empty')
      expect(validator(123 as any).valid).toBe(false)
    })

    it('should validate number property', () => {
      const validator: PropertyValidator = (value) => {
        if (typeof value !== 'number') {
          return { valid: false, error: 'Value must be a number' }
        }
        if (value < 0) {
          return { valid: false, error: 'Value must be positive' }
        }
        return { valid: true }
      }

      expect(validator(42).valid).toBe(true)
      expect(validator(-1).valid).toBe(false)
      expect(validator('42' as any).valid).toBe(false)
    })

    it('should validate required property', () => {
      const validator: PropertyValidator = (value) => {
        if (value === null || value === undefined || value === '') {
          return { valid: false, error: 'Value is required' }
        }
        return { valid: true }
      }

      expect(validator('value').valid).toBe(true)
      expect(validator(null).valid).toBe(false)
      expect(validator(undefined).valid).toBe(false)
      expect(validator('').valid).toBe(false)
    })
  })

  describe('PropertySerializer', () => {
    it('should serialize string value', () => {
      const serializer: PropertySerializer = (value) => String(value)
      expect(serializer('hello')).toBe('hello')
      expect(serializer(123)).toBe('123')
    })

    it('should serialize number value', () => {
      const serializer: PropertySerializer = (value) => {
        if (typeof value === 'number') {
          return value.toString()
        }
        return '0'
      }
      expect(serializer(42)).toBe('42')
    })

    it('should serialize array value', () => {
      const serializer: PropertySerializer = (value) => {
        if (Array.isArray(value)) {
          return value.join(',')
        }
        return ''
      }
      expect(serializer(['a', 'b', 'c'])).toBe('a,b,c')
    })

    it('should serialize boolean value', () => {
      const serializer: PropertySerializer = (value) => {
        if (typeof value === 'boolean') {
          return value ? 'true' : 'false'
        }
        return 'false'
      }
      expect(serializer(true)).toBe('true')
      expect(serializer(false)).toBe('false')
    })
  })

  describe('PropertyRegistry', () => {
    it('should register and retrieve property components', () => {
      const TextPropertyComponent = () => null

      const registry: PropertyRegistry = {
        text: {
          component: TextPropertyComponent,
          validator: (v) => {
            return typeof v === 'string' ? { valid: true } : { valid: false, error: 'Invalid' }
          },
          serializer: (v) => String(v),
        },
      }
      expect(registry.text).toBeDefined()
      expect(registry.text.validator).toBeDefined()
      expect(registry.text.serializer).toBeDefined()
      expect(registry.text.validator('test').valid).toBe(true)
      expect(registry.text.serializer('test')).toBe('test')
    })

    it('should register multiple property types', () => {
      const TextComponent = () => null
      const NumberComponent = () => null
      const SelectComponent = () => null

      const registry: PropertyRegistry = {
        text: {
          component: TextComponent,
          validator: (v) => ({ valid: true }),
        },
        number: {
          component: NumberComponent,
          validator: (v) => ({ valid: true }),
        },
        select: {
          component: SelectComponent,
          validator: (v) => ({ valid: true }),
        },
      }
      expect(Object.keys(registry)).toHaveLength(3)
      expect(registry.text.component).toBe(TextComponent)
      expect(registry.number.component).toBe(NumberComponent)
      expect(registry.select.component).toBe(SelectComponent)
    })

    it('should support default value factory', () => {
      const registry: PropertyRegistry = {
        text: {
          component: () => null,
          defaultValueFactory: () => '',
        },
        number: {
          component: () => null,
          defaultValueFactory: () => 0,
        },
        checkbox: {
          component: () => null,
          defaultValueFactory: () => false,
        },
      }
      expect(registry.text.defaultValueFactory?.()).toBe('')
      expect(registry.number.defaultValueFactory?.()).toBe(0)
      expect(registry.checkbox.defaultValueFactory?.()).toBe(false)
    })
  })

  describe('SelectOption', () => {
    it('should create select option with required fields', () => {
      const option: SelectOption = {
        id: 'opt-1',
        value: 'Option 1',
      }
      expect(option.id).toBe('opt-1')
      expect(option.value).toBe('Option 1')
    })

    it('should create select option with color', () => {
      const option: SelectOption = {
        id: 'opt-1',
        value: 'Done',
        color: 'green',
      }
      expect(option.color).toBe('green')
    })

    it('should allow optional color field', () => {
      const option: SelectOption = {
        id: 'opt-1',
        value: 'Done',
      }
      expect(option.color).toBeUndefined()
    })
  })

  describe('PropertyValueType', () => {
    it('should support text-related types', () => {
      const textValue: PropertyValue = 'Some text'
      const urlValue: PropertyValue = 'https://example.com'
      const emailValue: PropertyValue = 'test@example.com'
      const phoneValue: PropertyValue = '+1234567890'

      expect(typeof textValue).toBe('string')
      expect(typeof urlValue).toBe('string')
      expect(typeof emailValue).toBe('string')
      expect(typeof phoneValue).toBe('string')
    })

    it('should support number type', () => {
      const value: PropertyValue = 123.45
      expect(typeof value).toBe('number')
    })

    it('should support boolean type', () => {
      const value: PropertyValue = true
      expect(typeof value).toBe('boolean')
    })

    it('should support array types for multi-select and multi-person', () => {
      const multiSelectValue: PropertyValue = ['opt-1', 'opt-2']
      const multiPersonValue: PropertyValue = ['user-1', 'user-2']

      expect(Array.isArray(multiSelectValue)).toBe(true)
      expect(Array.isArray(multiPersonValue)).toBe(true)
      expect(multiSelectValue).toHaveLength(2)
      expect(multiPersonValue).toHaveLength(2)
    })

    it('should support null for empty values', () => {
      const emptyValue: PropertyValue = null
      expect(emptyValue).toBeNull()
    })
  })
})
