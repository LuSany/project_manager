import type { GanttTask, TaskBarPosition } from './types'

interface GanttTaskBarProps {
  task: GanttTask
  position: TaskBarPosition
  color: string
  isCritical?: boolean
  onClick?: () => void
  onHover?: (taskId: string | null) => void
}

export function GanttTaskBar({
  task,
  position,
  color,
  isCritical,
  onClick,
  onHover,
}: GanttTaskBarProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }

  const handleMouseEnter = () => {
    onHover?.(task.id)
  }

  const handleMouseLeave = () => {
    onHover?.(null)
  }

  return (
    <g
      className="cursor-pointer transition-opacity hover:opacity-80"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <rect
        x={position.x}
        y={position.y}
        width={position.width}
        height={position.height}
        rx={4}
        fill={color}
        opacity={0.15}
      />

      <rect
        x={position.x}
        y={position.y}
        width={position.width * (task.progress / 100)}
        height={position.height}
        rx={4}
        fill={color}
        opacity={0.6}
      />

      {isCritical && (
        <rect
          x={position.x - 2}
          y={position.y - 2}
          width={position.width + 4}
          height={position.height + 4}
          rx={4}
          fill="none"
          stroke="#f97316"
          strokeWidth={2}
        />
      )}

      {position.width > 60 && (
        <>
          <text
            x={position.x + 8}
            y={position.y + position.height / 2 + 4}
            fontSize={12}
            fill="hsl(var(--foreground))"
            fontFamily="system-ui, sans-serif"
            style={{ pointerEvents: 'none' }}
          >
            {task.title}
          </text>

          <text
            x={position.x + position.width - 8}
            y={position.y + position.height / 2 + 4}
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
            fontFamily="system-ui, sans-serif"
            textAnchor="end"
            style={{ pointerEvents: 'none' }}
          >
            {task.progress}%
          </text>
        </>
      )}
    </g>
  )
}
