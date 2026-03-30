import { describe, it, expect } from 'vitest'
import { calculateRemainingHours, calculatePercentage, validateSubQuotas } from '@/lib/quota'

describe('Quota Checking Logic', () => {
  describe('calculateRemainingHours', () => {
    it('should calculate remaining hours correctly', () => {
      expect(calculateRemainingHours(100, 30)).toBe(70)
      expect(calculateRemainingHours(100, 0)).toBe(100)
      expect(calculateRemainingHours(100, 100)).toBe(0)
    })

    it('should return 0 when usage exceeds quota', () => {
      expect(calculateRemainingHours(100, 120)).toBe(0)
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50)
      expect(calculatePercentage(80, 100)).toBe(80)
      expect(calculatePercentage(0, 100)).toBe(0)
    })

    it('should return 0 when totalHours is 0', () => {
      expect(calculatePercentage(10, 0)).toBe(0)
    })

    it('should return 100 when usage exceeds quota', () => {
      expect(calculatePercentage(150, 100)).toBe(100)
    })

    it('should round to 1 decimal place', () => {
      expect(calculatePercentage(33.33, 100)).toBe(33.3)
    })
  })

  describe('validateSubQuotas', () => {
    it('should accept valid sub-quotas', () => {
      const result = validateSubQuotas(100, [
        { deviceTypeId: 'dt1', subHours: 30 },
        { deviceTypeId: 'dt2', subHours: 40 },
      ])
      expect(result.valid).toBe(true)
    })

    it('should accept empty sub-quotas', () => {
      const result = validateSubQuotas(100, [])
      expect(result.valid).toBe(true)
    })

    it('should reject sub-quotas sum exceeding total', () => {
      const result = validateSubQuotas(100, [
        { deviceTypeId: 'dt1', subHours: 60 },
        { deviceTypeId: 'dt2', subHours: 50 },
      ])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('不能超过')
    })

    it('should reject negative hours', () => {
      const result = validateSubQuotas(100, [{ deviceTypeId: 'dt1', subHours: -10 }])
      expect(result.valid).toBe(false)
    })

    it('should reject zero hours', () => {
      const result = validateSubQuotas(100, [{ deviceTypeId: 'dt1', subHours: 0 }])
      expect(result.valid).toBe(false)
    })
  })
})
