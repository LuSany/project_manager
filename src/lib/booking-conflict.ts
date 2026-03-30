export interface ExistingBooking {
  startTime: Date
  endTime: Date
  status: string
}

export interface ConflictResult {
  hasConflict: boolean
  conflictingBooking?: ExistingBooking
}

export function hasBookingConflict(
  existingBookings: ExistingBooking[],
  newStartTime: Date,
  newEndTime: Date
): ConflictResult {
  const activeBookings = existingBookings.filter(
    (b) => b.status === 'RESERVED' || b.status === 'IN_PROGRESS'
  )

  for (const booking of activeBookings) {
    if (booking.startTime < newEndTime && booking.endTime > newStartTime) {
      return {
        hasConflict: true,
        conflictingBooking: booking,
      }
    }
  }

  return { hasConflict: false }
}
