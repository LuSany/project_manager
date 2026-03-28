import React from 'react'
import { DependencyType } from '@/types/task-dependency'
import type { GanttDependency, TaskBarPosition } from './types'

const DEPENDENCY_COLORS: Record<DependencyType, string> = {
  [DependencyType.FINISH_TO_START]: '#3b82f6',
  [DependencyType.START_TO_START]: '#22c55e',
  [DependencyType.FINISH_TO_FINISH]: '#a855f7',
  [DependencyType.START_TO_FINISH]: '#f97316',
}

const CRITICAL_COLOR = '#f97316'

interface GanttDependencyLineProps {
  dependency: GanttDependency
  sourcePosition: TaskBarPosition
  targetPosition: TaskBarPosition
  dependencyType: DependencyType
  isCritical?: boolean
  isHovered?: boolean
  onHover?: (id: string | null) => void
}

function getConnectionPoints(
  sourcePos: TaskBarPosition,
  targetPos: TaskBarPosition,
  depType: DependencyType
): {
  startX: number
  startY: number
  endX: number
  endY: number
  arrowDirection: 'left' | 'right'
} {
  switch (depType) {
    case DependencyType.FINISH_TO_START:
      return {
        startX: sourcePos.x + sourcePos.width,
        startY: sourcePos.y + sourcePos.height / 2,
        endX: targetPos.x,
        endY: targetPos.y + targetPos.height / 2,
        arrowDirection: 'left',
      }
    case DependencyType.START_TO_START:
      return {
        startX: sourcePos.x,
        startY: sourcePos.y + sourcePos.height / 2,
        endX: targetPos.x,
        endY: targetPos.y + targetPos.height / 2,
        arrowDirection: 'left',
      }
    case DependencyType.FINISH_TO_FINISH:
      return {
        startX: sourcePos.x + sourcePos.width,
        startY: sourcePos.y + sourcePos.height / 2,
        endX: targetPos.x + targetPos.width,
        endY: targetPos.y + targetPos.height / 2,
        arrowDirection: 'right',
      }
    case DependencyType.START_TO_FINISH:
      return {
        startX: sourcePos.x,
        startY: sourcePos.y + sourcePos.height / 2,
        endX: targetPos.x + targetPos.width,
        endY: targetPos.y + targetPos.height / 2,
        arrowDirection: 'right',
      }
  }
}

function createOrthogonalPath(startX: number, startY: number, endX: number, endY: number): string {
  const gap = 10
  const midX = startX + gap

  if (endX > startX) {
    const midY = Math.min(startY, endY) - 20
    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${midY} L ${endX - gap} ${midY} L ${endX - gap} ${endY} L ${endX} ${endY}`
  } else {
    const midY = (startY + endY) / 2
    return `M ${startX} ${startY} L ${startX - gap} ${startY} L ${startX - gap} ${midY} L ${endX + gap} ${midY} L ${endX + gap} ${endY} L ${endX} ${endY}`
  }
}

function createArrowPolygon(endX: number, endY: number, direction: 'left' | 'right'): string {
  const arrowSize = 8
  if (direction === 'left') {
    return `${endX},${endY - arrowSize / 2} ${endX - arrowSize},${endY} ${endX},${endY + arrowSize / 2}`
  } else {
    return `${endX},${endY - arrowSize / 2} ${endX + arrowSize},${endY} ${endX},${endY + arrowSize / 2}`
  }
}

export function GanttDependencyLine({
  dependency,
  sourcePosition,
  targetPosition,
  dependencyType,
  isCritical = false,
  isHovered = false,
  onHover,
}: GanttDependencyLineProps) {
  const points = getConnectionPoints(sourcePosition, targetPosition, dependencyType)
  const path = createOrthogonalPath(points.startX, points.startY, points.endX, points.endY)
  const arrow = createArrowPolygon(points.endX, points.endY, points.arrowDirection)

  const baseColor = isCritical ? CRITICAL_COLOR : DEPENDENCY_COLORS[dependencyType]
  const strokeWidth = isHovered || isCritical ? 3 : 2

  const handleMouseEnter = () => {
    onHover?.(dependency.id)
  }

  const handleMouseLeave = () => {
    onHover?.(null)
  }

  return (
    <g
      className="transition-opacity"
      style={{ opacity: isHovered ? 1 : 0.85 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <path
        d={path}
        fill="none"
        stroke={baseColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points={arrow} fill={baseColor} />
    </g>
  )
}
