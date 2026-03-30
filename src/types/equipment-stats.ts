/**
 * Equipment Stats API Types
 *
 * Types for equipment statistics APIs including project hours,
 * device utilization, usage records, and Excel export functionality.
 */

/**
 * Parameters for project hours aggregation
 */
export interface ProjectHoursParams {
  /** Month in 'yyyy-MM' format, defaults to current month */
  month?: string
  /** Number of top projects to return, defaults to 10 */
  topN?: number
}

/**
 * Single project hours summary item
 */
export interface ProjectHoursItem {
  /** Project ID */
  projectId: string
  /** Project name */
  projectName: string
  /** Total hours used by this project */
  totalHours: number
  /** Number of bookings for this project */
  bookingCount: number
}

/**
 * Parameters for device utilization calculation
 */
export interface DeviceUtilizationParams {
  /** Start date in ISO format */
  startDate: string
  /** End date in ISO format */
  endDate: string
  /** Optional device type ID to filter by */
  deviceTypeId?: string
}

/**
 * Single device utilization item
 */
export interface DeviceUtilizationItem {
  /** Device ID */
  deviceId: string
  /** Device name */
  deviceName: string
  /** Device type name */
  deviceTypeName: string
  /** Utilization percentage (0-100) */
  utilization: number
  /** Total hours the device was in use */
  usedHours: number
  /** Total available hours in the period */
  availableHours: number
  /** Daily usage trend for charts */
  dailyTrend: Array<{ date: string; hours: number }>
}

/**
 * Parameters for usage records query
 */
export interface UsageRecordsParams {
  /** Filter by project ID */
  projectId?: string
  /** Filter by device ID */
  deviceId?: string
  /** Filter by user ID */
  userId?: string
  /** Filter records starting after this date */
  startDate?: string
  /** Filter records ending before this date */
  endDate?: string
  /** Page number (1-indexed) */
  page?: number
  /** Number of items per page */
  pageSize?: number
  /** Field to sort by */
  sortBy?: string
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Single usage record item
 */
export interface UsageRecordItem {
  /** Booking ID */
  id: string
  /** Device name */
  deviceName: string
  /** Device type name */
  deviceTypeName: string
  /** Project name (nullable if no project associated) */
  projectName: string | null
  /** User name who made the booking */
  userName: string
  /** Booking start time */
  startTime: string
  /** Booking end time */
  endTime: string
  /** Booking status */
  status: string
  /** Duration in hours */
  hours: number
}

/**
 * Paginated usage records response
 */
export interface UsageRecordsResponse {
  /** Array of usage record items */
  items: UsageRecordItem[]
  /** Total number of records matching filters */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  pageSize: number
  /** Total number of pages */
  totalPages: number
}

/**
 * Parameters for Excel export
 */
export interface ExportParams {
  /** Type of export: project-hours, device-utilization, or usage-record */
  type: 'project-hours' | 'device-utilization' | 'usage-record'
  /** Month in 'yyyy-MM' format (for project-hours) */
  month?: string
  /** Start date for export (for device-utilization, usage-record) */
  startDate?: string
  /** End date for export (for device-utilization, usage-record) */
  endDate?: string
  /** Filter by project ID */
  projectId?: string
  /** Filter by device type ID */
  deviceTypeId?: string
}

/**
 * Stats overview response
 */
export interface StatsOverview {
  /** Total number of bookings in the period */
  totalBookings: number
  /** Total hours used across all bookings */
  totalHours: number
  /** Number of active devices */
  activeDevices: number
  /** Total number of devices */
  totalDevices: number
}
