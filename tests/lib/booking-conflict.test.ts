import { describe, it, expect } from 'vitest'
import { hasBookingConflict } from '@/lib/booking-conflict'

describe('Booking Conflict Detection', () => {
  describe('No Conflict Scenarios', () => {
    it('should return no conflict when new booking starts after existing ends', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T12:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T12:00')
      const newEnd = new Date('2024-01-01T14:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(false)
    })

    it('should return no conflict when new booking ends before existing starts', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T14:00'),
          endTime: new Date('2024-01-01T16:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T10:00')
      const newEnd = new Date('2024-01-01T12:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(false)
    })

    it('should ignore CANCELLED bookings', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T14:00'),
          status: 'CANCELLED',
        },
      ]
      const newStart = new Date('2024-01-01T11:00')
      const newEnd = new Date('2024-01-01T13:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(false)
    })

    it('should ignore COMPLETED bookings', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T14:00'),
          status: 'COMPLETED',
        },
      ]
      const newStart = new Date('2024-01-01T11:00')
      const newEnd = new Date('2024-01-01T13:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(false)
    })
  })

  describe('Conflict Scenarios', () => {
    it('should detect partial overlap at start', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T14:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T09:00')
      const newEnd = new Date('2024-01-01T11:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(true)
      expect(result.conflictingBooking).toBeDefined()
    })

    it('should detect partial overlap at end', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T14:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T13:00')
      const newEnd = new Date('2024-01-01T15:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(true)
    })

    it('should detect complete overlap (new within existing)', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T14:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T11:00')
      const newEnd = new Date('2024-01-01T13:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(true)
    })

    it('should detect complete overlap (existing within new)', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T11:00'),
          endTime: new Date('2024-01-01T13:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T10:00')
      const newEnd = new Date('2024-01-01T14:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(true)
    })

    it('should detect exact same time as conflict', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T14:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T10:00')
      const newEnd = new Date('2024-01-01T14:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(true)
    })

    it('should return first conflicting booking found', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T08:00'),
          endTime: new Date('2024-01-01T10:00'),
          status: 'RESERVED',
        },
        {
          startTime: new Date('2024-01-01T11:00'),
          endTime: new Date('2024-01-01T13:00'),
          status: 'RESERVED',
        },
        {
          startTime: new Date('2024-01-01T15:00'),
          endTime: new Date('2024-01-01T17:00'),
          status: 'RESERVED',
        },
      ]
      const newStart = new Date('2024-01-01T12:00')
      const newEnd = new Date('2024-01-01T16:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(true)
      expect(result.conflictingBooking?.startTime).toEqual(new Date('2024-01-01T11:00'))
    })
  })

  describe('IN_PROGRESS Status', () => {
    it('should check IN_PROGRESS bookings for conflict', () => {
      const existing = [
        {
          startTime: new Date('2024-01-01T10:00'),
          endTime: new Date('2024-01-01T14:00'),
          status: 'IN_PROGRESS',
        },
      ]
      const newStart = new Date('2024-01-01T11:00')
      const newEnd = new Date('2024-01-01T13:00')

      const result = hasBookingConflict(existing, newStart, newEnd)
      expect(result.hasConflict).toBe(true)
    })
  })

  describe('Empty Array', () => {
    it('should return no conflict when no existing bookings', () => {
      const result = hasBookingConflict(
        [],
        new Date('2024-01-01T10:00'),
        new Date('2024-01-01T14:00')
      )
      expect(result.hasConflict).toBe(false)
    })
  })
})
