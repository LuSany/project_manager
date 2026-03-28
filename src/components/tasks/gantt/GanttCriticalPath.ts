import type { GanttTask, GanttDependency } from './types'

function getTaskDuration(task: GanttTask): number {
  if (!task.startDate || !task.dueDate) return 1
  const start = new Date(task.startDate)
  const end = new Date(task.dueDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 1)
}

export function calculateCriticalPath(
  tasks: GanttTask[],
  dependencies: GanttDependency[]
): Set<string> {
  if (tasks.length === 0 || dependencies.length === 0) {
    return new Set()
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const taskDuration = new Map(tasks.map((t) => [t.id, getTaskDuration(t)]))

  const adjacency = new Map<string, string[]>()
  const reverseAdjacency = new Map<string, string[]>()

  tasks.forEach((t) => {
    adjacency.set(t.id, [])
    reverseAdjacency.set(t.id, [])
  })

  dependencies.forEach((dep) => {
    adjacency.get(dep.sourceTaskId)?.push(dep.targetTaskId)
    reverseAdjacency.get(dep.targetTaskId)?.push(dep.sourceTaskId)
  })

  const inDegree = new Map<string, number>()
  tasks.forEach((t) => {
    inDegree.set(t.id, reverseAdjacency.get(t.id)?.length || 0)
  })

  const queue: string[] = []
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) queue.push(taskId)
  })

  const earliestStart = new Map<string, number>()
  const earliestFinish = new Map<string, number>()

  while (queue.length > 0) {
    const current = queue.shift()!
    const duration = taskDuration.get(current) || 1
    const predecessors = reverseAdjacency.get(current) || []

    let maxPredFinish = 0
    predecessors.forEach((predId) => {
      const predFinish = earliestFinish.get(predId) || 0
      maxPredFinish = Math.max(maxPredFinish, predFinish)
    })

    const es = maxPredFinish
    const ef = es + duration
    earliestStart.set(current, es)
    earliestFinish.set(current, ef)

    const children = adjacency.get(current) || []
    children.forEach((childId) => {
      const currentDegree = inDegree.get(childId) || 0
      inDegree.set(childId, currentDegree - 1)
      if (currentDegree - 1 === 0) {
        queue.push(childId)
      }
    })
  }

  let maxFinish = 0
  let endTaskId = ''
  earliestFinish.forEach((ef, taskId) => {
    if (ef > maxFinish) {
      maxFinish = ef
      endTaskId = taskId
    }
  })

  if (!endTaskId) return new Set()

  const criticalPath: string[] = []
  let currentTask = endTaskId

  while (currentTask) {
    criticalPath.push(currentTask)
    const predecessors = reverseAdjacency.get(currentTask) || []
    if (predecessors.length === 0) break

    let maxPredFinish = 0
    let nextTask = ''

    predecessors.forEach((predId) => {
      const predFinish = earliestFinish.get(predId) || 0
      const predStart = earliestStart.get(predId) || 0
      if (predFinish >= maxPredFinish) {
        maxPredFinish = predFinish
        nextTask = predId
      }
    })

    if (!nextTask) break

    const currentES = earliestStart.get(currentTask) || 0
    const nextES = earliestStart.get(nextTask) || 0
    const duration = taskDuration.get(nextTask) || 1

    if (nextES + duration !== currentES) break

    currentTask = nextTask
  }

  return new Set(criticalPath)
}
