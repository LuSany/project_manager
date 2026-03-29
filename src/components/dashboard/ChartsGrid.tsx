import { TaskStatusDonut } from './TaskStatusDonut'
import { PriorityDonut } from './PriorityDonut'
import { ProjectComparisonChart } from './ProjectComparisonChart'
import { MilestoneProgressList } from './MilestoneProgressList'

export function ChartsGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <TaskStatusDonut />
      <PriorityDonut />
      <ProjectComparisonChart />
      <MilestoneProgressList />
    </div>
  )
}
