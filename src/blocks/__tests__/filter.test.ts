/**
 * Filter 筛选系统测试
 * 测试筛选器、筛选组及相关功能
 */

import { describe, it, expect } from 'vitest'
import type { PropertyType } from '../../properties/types'
import type { Filter, FilterGroup, FilterContext, FilterCondition } from '../filter'
import {
  checkFilter,
  checkFilterGroup,
  createEmptyFilterGroup,
  mergeFilterGroups,
  validateFilter,
  getAvailableConditions,
} from '../filter'

describe('Filter System', () => {
  describe('FilterCondition', () => {
    it('should support all filter conditions', () => {
      const conditions: FilterCondition[] = [
        'is',
        'isNot',
        'contains',
        'notContains',
        'isEmpty',
        'isNotEmpty',
        'before',
        'after',
        'greaterThan',
        'lessThan',
        'greaterThanOrEqual',
        'lessThanOrEqual',
      ]
      expect(conditions.length).toBeGreaterThan(0)
      expect(conditions.length).toBe(12)
    })
  })

  describe('checkFilter', () => {
    const createContext = (properties: Record<string, any>): FilterContext => ({
      properties,
      propertyTypes: new Map([
        ['status', 'select' as PropertyType],
        ['priority', 'select' as PropertyType],
        ['title', 'text' as PropertyType],
        ['dueDate', 'date' as PropertyType],
        ['score', 'number' as PropertyType],
        ['tags', 'multiSelect' as PropertyType],
      ]),
    })

    describe('is condition', () => {
      it('should return true when value matches', () => {
        const filter: Filter = { propertyId: 'status', condition: 'is', value: 'Todo' }
        const context = createContext({ status: 'Todo' })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value does not match', () => {
        const filter: Filter = { propertyId: 'status', condition: 'is', value: 'Done' }
        const context = createContext({ status: 'Todo' })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('isNot condition', () => {
      it('should return true when value does not match', () => {
        const filter: Filter = { propertyId: 'status', condition: 'isNot', value: 'Done' }
        const context = createContext({ status: 'Todo' })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value matches', () => {
        const filter: Filter = { propertyId: 'status', condition: 'isNot', value: 'Todo' }
        const context = createContext({ status: 'Todo' })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('contains condition', () => {
      it('should return true when string contains value (case insensitive)', () => {
        const filter: Filter = { propertyId: 'title', condition: 'contains', value: 'world' }
        const context = createContext({ title: 'Hello World' })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return true when array contains value', () => {
        const filter: Filter = { propertyId: 'tags', condition: 'contains', value: 'urgent' }
        const context = createContext({ tags: ['urgent', 'important'] })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when string does not contain value', () => {
        const filter: Filter = { propertyId: 'title', condition: 'contains', value: 'xyz' }
        const context = createContext({ title: 'Hello World' })
        expect(checkFilter(filter, context)).toBe(false)
      })

      it('should return false for non-string and non-array values', () => {
        const filter: Filter = { propertyId: 'score', condition: 'contains', value: '1' }
        const context = createContext({ score: 100 })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('notContains condition', () => {
      it('should return true when string does not contain value', () => {
        const filter: Filter = { propertyId: 'title', condition: 'notContains', value: 'xyz' }
        const context = createContext({ title: 'Hello World' })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when string contains value', () => {
        const filter: Filter = { propertyId: 'title', condition: 'notContains', value: 'world' }
        const context = createContext({ title: 'Hello World' })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('isEmpty condition', () => {
      it('should return true for empty string', () => {
        const filter: Filter = { propertyId: 'title', condition: 'isEmpty', value: undefined }
        const context = createContext({ title: '' })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return true for null value', () => {
        const filter: Filter = { propertyId: 'title', condition: 'isEmpty', value: undefined }
        const context = createContext({ title: null })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return true for undefined value', () => {
        const filter: Filter = { propertyId: 'title', condition: 'isEmpty', value: undefined }
        const context = createContext({ title: undefined })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return true for empty array', () => {
        const filter: Filter = { propertyId: 'tags', condition: 'isEmpty', value: undefined }
        const context = createContext({ tags: [] })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false for non-empty value', () => {
        const filter: Filter = { propertyId: 'title', condition: 'isEmpty', value: undefined }
        const context = createContext({ title: 'Hello' })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('isNotEmpty condition', () => {
      it('should return true for non-empty string', () => {
        const filter: Filter = { propertyId: 'title', condition: 'isNotEmpty', value: undefined }
        const context = createContext({ title: 'Hello' })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false for empty string', () => {
        const filter: Filter = { propertyId: 'title', condition: 'isNotEmpty', value: undefined }
        const context = createContext({ title: '' })
        expect(checkFilter(filter, context)).toBe(false)
      })

      it('should return false for null value', () => {
        const filter: Filter = { propertyId: 'title', condition: 'isNotEmpty', value: undefined }
        const context = createContext({ title: null })
        expect(checkFilter(filter, context)).toBe(false)
      })

      it('should return false for empty array', () => {
        const filter: Filter = { propertyId: 'tags', condition: 'isNotEmpty', value: undefined }
        const context = createContext({ tags: [] })
        expect(checkFilter(filter, context)).toBe(false)
      })

      it('should return true for non-empty array', () => {
        const filter: Filter = { propertyId: 'tags', condition: 'isNotEmpty', value: undefined }
        const context = createContext({ tags: ['tag1'] })
        expect(checkFilter(filter, context)).toBe(true)
      })
    })

    describe('before condition', () => {
      it('should return true when value is before filter value (number)', () => {
        const filter: Filter = { propertyId: 'dueDate', condition: 'before', value: 20240115 }
        const context = createContext({ dueDate: 20240101 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value is after filter value', () => {
        const filter: Filter = { propertyId: 'dueDate', condition: 'before', value: 20240115 }
        const context = createContext({ dueDate: 20240201 })
        expect(checkFilter(filter, context)).toBe(false)
      })

      it('should return false for non-number values', () => {
        const filter: Filter = { propertyId: 'dueDate', condition: 'before', value: 20240115 }
        const context = createContext({ dueDate: '2024-01-01' })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('after condition', () => {
      it('should return true when value is after filter value (number)', () => {
        const filter: Filter = { propertyId: 'dueDate', condition: 'after', value: 20240115 }
        const context = createContext({ dueDate: 20240201 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value is before filter value', () => {
        const filter: Filter = { propertyId: 'dueDate', condition: 'after', value: 20240115 }
        const context = createContext({ dueDate: 20240101 })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('greaterThan condition', () => {
      it('should return true when value is greater', () => {
        const filter: Filter = { propertyId: 'score', condition: 'greaterThan', value: 50 }
        const context = createContext({ score: 75 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value is less', () => {
        const filter: Filter = { propertyId: 'score', condition: 'greaterThan', value: 50 }
        const context = createContext({ score: 25 })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('lessThan condition', () => {
      it('should return true when value is less', () => {
        const filter: Filter = { propertyId: 'score', condition: 'lessThan', value: 50 }
        const context = createContext({ score: 25 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value is greater', () => {
        const filter: Filter = { propertyId: 'score', condition: 'lessThan', value: 50 }
        const context = createContext({ score: 75 })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('greaterThanOrEqual condition', () => {
      it('should return true when value is equal', () => {
        const filter: Filter = { propertyId: 'score', condition: 'greaterThanOrEqual', value: 50 }
        const context = createContext({ score: 50 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return true when value is greater', () => {
        const filter: Filter = { propertyId: 'score', condition: 'greaterThanOrEqual', value: 50 }
        const context = createContext({ score: 75 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value is less', () => {
        const filter: Filter = { propertyId: 'score', condition: 'greaterThanOrEqual', value: 50 }
        const context = createContext({ score: 25 })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    describe('lessThanOrEqual condition', () => {
      it('should return true when value is equal', () => {
        const filter: Filter = { propertyId: 'score', condition: 'lessThanOrEqual', value: 50 }
        const context = createContext({ score: 50 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return true when value is less', () => {
        const filter: Filter = { propertyId: 'score', condition: 'lessThanOrEqual', value: 50 }
        const context = createContext({ score: 25 })
        expect(checkFilter(filter, context)).toBe(true)
      })

      it('should return false when value is greater', () => {
        const filter: Filter = { propertyId: 'score', condition: 'lessThanOrEqual', value: 50 }
        const context = createContext({ score: 75 })
        expect(checkFilter(filter, context)).toBe(false)
      })
    })

    it('should return false for undefined property type', () => {
      const filter: Filter = { propertyId: 'unknown', condition: 'is', value: 'test' }
      const context = createContext({ unknown: 'test' })
      expect(checkFilter(filter, context)).toBe(false)
    })
  })

  describe('checkFilterGroup', () => {
    const createContext = (properties: Record<string, any>): FilterContext => ({
      properties,
      propertyTypes: new Map([
        ['status', 'select' as PropertyType],
        ['priority', 'select' as PropertyType],
        ['title', 'text' as PropertyType],
      ]),
    })

    describe('AND operator', () => {
      it('should return true when all filters pass', () => {
        const filterGroup: FilterGroup = {
          filters: [
            { propertyId: 'status', condition: 'is', value: 'Todo' },
            { propertyId: 'priority', condition: 'is', value: 'high' },
          ],
          operator: 'and',
        }
        const context = createContext({ status: 'Todo', priority: 'high' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
        expect(result.failedFilters).toHaveLength(0)
      })

      it('should return false when any filter fails', () => {
        const filterGroup: FilterGroup = {
          filters: [
            { propertyId: 'status', condition: 'is', value: 'Todo' },
            { propertyId: 'priority', condition: 'is', value: 'high' },
          ],
          operator: 'and',
        }
        const context = createContext({ status: 'Done', priority: 'high' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(false)
        expect(result.failedFilters).toHaveLength(1)
        expect(result.failedFilters[0].propertyId).toBe('status')
      })

      it('should fail on first failed filter', () => {
        const filterGroup: FilterGroup = {
          filters: [
            { propertyId: 'status', condition: 'is', value: 'Todo' },
            { propertyId: 'priority', condition: 'is', value: 'high' },
            { propertyId: 'title', condition: 'contains', value: 'urgent' },
          ],
          operator: 'and',
        }
        const context = createContext({ status: 'Done', priority: 'low', title: 'Test' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(false)
      })
    })

    describe('OR operator', () => {
      it('should return true when any filter passes', () => {
        const filterGroup: FilterGroup = {
          filters: [
            { propertyId: 'status', condition: 'is', value: 'Todo' },
            { propertyId: 'status', condition: 'is', value: 'Done' },
          ],
          operator: 'or',
        }
        const context = createContext({ status: 'Done' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })

      it('should return false when all filters fail', () => {
        const filterGroup: FilterGroup = {
          filters: [
            { propertyId: 'status', condition: 'is', value: 'Todo' },
            { propertyId: 'status', condition: 'is', value: 'In Progress' },
          ],
          operator: 'or',
        }
        const context = createContext({ status: 'Done' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })

      it('should pass on first successful filter', () => {
        const filterGroup: FilterGroup = {
          filters: [
            { propertyId: 'status', condition: 'is', value: 'Todo' },
            { propertyId: 'status', condition: 'is', value: 'Done' },
            { propertyId: 'status', condition: 'is', value: 'In Progress' },
          ],
          operator: 'or',
        }
        const context = createContext({ status: 'In Progress' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })
    })

    describe('nested filter groups', () => {
      it('should handle nested groups with AND operator', () => {
        const filterGroup: FilterGroup = {
          filters: [{ propertyId: 'status', condition: 'is', value: 'Todo' }],
          operator: 'and',
          groups: [
            {
              filters: [{ propertyId: 'priority', condition: 'is', value: 'high' }],
              operator: 'or',
            },
          ],
        }
        const context = createContext({ status: 'Todo', priority: 'high' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })

      it('should fail when nested group fails with AND operator', () => {
        const filterGroup: FilterGroup = {
          filters: [{ propertyId: 'status', condition: 'is', value: 'Todo' }],
          operator: 'and',
          groups: [
            {
              filters: [{ propertyId: 'priority', condition: 'is', value: 'high' }],
              operator: 'or',
            },
          ],
        }
        const context = createContext({ status: 'Todo', priority: 'low' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })

      it('should handle nested groups with OR operator', () => {
        const filterGroup: FilterGroup = {
          filters: [{ propertyId: 'status', condition: 'is', value: 'Todo' }],
          operator: 'or',
          groups: [
            {
              filters: [{ propertyId: 'priority', condition: 'is', value: 'high' }],
              operator: 'or',
            },
          ],
        }
        const context = createContext({ status: 'Done', priority: 'high' })
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })
    })

    describe('empty filter groups', () => {
      it('should return true for empty AND group', () => {
        const filterGroup: FilterGroup = { filters: [], operator: 'and' }
        const context = createContext({})
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })

      it('should return true for empty OR group', () => {
        const filterGroup: FilterGroup = { filters: [], operator: 'or' }
        const context = createContext({})
        const result = checkFilterGroup(filterGroup, context)
        expect(result.passed).toBe(true)
      })
    })
  })

  describe('createEmptyFilterGroup', () => {
    it('should create empty filter group', () => {
      const group = createEmptyFilterGroup()
      expect(group.filters).toHaveLength(0)
      expect(group.operator).toBe('and')
      expect(group.groups).toBeDefined()
      expect(group.groups).toHaveLength(0)
    })
  })

  describe('mergeFilterGroups', () => {
    it('should merge multiple filter groups', () => {
      const group1: FilterGroup = {
        filters: [{ propertyId: 'status', condition: 'is', value: 'Todo' }],
        operator: 'and',
      }
      const group2: FilterGroup = {
        filters: [{ propertyId: 'priority', condition: 'is', value: 'high' }],
        operator: 'and',
        groups: [
          {
            filters: [{ propertyId: 'title', condition: 'contains', value: 'test' }],
            operator: 'or',
          },
        ],
      }

      const merged = mergeFilterGroups(group1, group2)

      expect(merged.filters).toHaveLength(2)
      expect(merged.operator).toBe('and')
      expect(merged.groups).toHaveLength(1)
    })

    it('should merge empty groups', () => {
      const group1: FilterGroup = { filters: [], operator: 'and' }
      const group2: FilterGroup = { filters: [], operator: 'and' }

      const merged = mergeFilterGroups(group1, group2)

      expect(merged.filters).toHaveLength(0)
    })
  })

  describe('validateFilter', () => {
    it('should validate isEmpty condition', () => {
      const filter: Filter = { propertyId: 'title', condition: 'isEmpty', value: undefined }
      expect(validateFilter(filter, 'text')).toBe(true)
    })

    it('should validate isNotEmpty condition', () => {
      const filter: Filter = { propertyId: 'title', condition: 'isNotEmpty', value: undefined }
      expect(validateFilter(filter, 'text')).toBe(true)
    })

    it('should validate is condition', () => {
      const filter: Filter = { propertyId: 'status', condition: 'is', value: 'Todo' }
      expect(validateFilter(filter, 'select')).toBe(true)
    })

    it('should validate isNot condition', () => {
      const filter: Filter = { propertyId: 'status', condition: 'isNot', value: 'Todo' }
      expect(validateFilter(filter, 'select')).toBe(true)
    })

    it('should validate contains for text type', () => {
      const filter: Filter = { propertyId: 'title', condition: 'contains', value: 'test' }
      expect(validateFilter(filter, 'text')).toBe(true)
    })

    it('should reject contains for number type', () => {
      const filter: Filter = { propertyId: 'score', condition: 'contains', value: '1' }
      expect(validateFilter(filter, 'number')).toBe(false)
    })

    it('should validate before for date type', () => {
      const filter: Filter = { propertyId: 'dueDate', condition: 'before', value: 20240101 }
      expect(validateFilter(filter, 'date')).toBe(true)
    })

    it('should reject before for text type', () => {
      const filter: Filter = { propertyId: 'title', condition: 'before', value: 20240101 }
      expect(validateFilter(filter, 'text')).toBe(false)
    })

    it('should validate greaterThan for number type', () => {
      const filter: Filter = { propertyId: 'score', condition: 'greaterThan', value: 50 }
      expect(validateFilter(filter, 'number')).toBe(true)
    })

    it('should reject greaterThan for text type', () => {
      const filter: Filter = { propertyId: 'title', condition: 'greaterThan', value: 50 }
      expect(validateFilter(filter, 'text')).toBe(false)
    })
  })

  describe('getAvailableConditions', () => {
    it('should return common conditions for text type', () => {
      const conditions = getAvailableConditions('text')
      expect(conditions).toContain('is')
      expect(conditions).toContain('isNot')
      expect(conditions).toContain('contains')
      expect(conditions).toContain('notContains')
      expect(conditions).toContain('isEmpty')
      expect(conditions).toContain('isNotEmpty')
    })

    it('should return numeric conditions for number type', () => {
      const conditions = getAvailableConditions('number')
      expect(conditions).toContain('greaterThan')
      expect(conditions).toContain('lessThan')
      expect(conditions).toContain('greaterThanOrEqual')
      expect(conditions).toContain('lessThanOrEqual')
    })

    it('should return date conditions for date type', () => {
      const conditions = getAvailableConditions('date')
      expect(conditions).toContain('before')
      expect(conditions).toContain('after')
    })

    it('should return select conditions for select type', () => {
      const conditions = getAvailableConditions('select')
      expect(conditions).toContain('is')
      expect(conditions).toContain('isNot')
      expect(conditions).not.toContain('contains')
    })

    it('should return multi-select conditions for multiSelect type', () => {
      const conditions = getAvailableConditions('multiSelect')
      expect(conditions).toContain('contains')
      expect(conditions).toContain('notContains')
    })

    it('should return checkbox conditions for checkbox type', () => {
      const conditions = getAvailableConditions('checkbox')
      expect(conditions).toContain('is')
      expect(conditions).toContain('isNot')
      expect(conditions).toHaveLength(2)
    })

    it('should return common conditions for unknown type', () => {
      const conditions = getAvailableConditions('file' as PropertyType)
      expect(conditions).toContain('is')
      expect(conditions).toContain('isNot')
      expect(conditions).toContain('isEmpty')
      expect(conditions).toContain('isNotEmpty')
    })
  })
})
