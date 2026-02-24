// ============================================================================
// 任务依赖类型定义
// ============================================================================

/**
 * 任务依赖类型
 */
export enum DependencyType {
  FINISH_TO_START = "FINISH_TO_START", // 前置任务完成后才能开始当前任务
  START_TO_START = "START_TO_START", // 前置任务开始后才能开始当前任务
  FINISH_TO_FINISH = "FINISH_TO_FINISH", // 前置任务完成后才能完成当前任务
  START_TO_FINISH = "START_TO_FINISH", // 前置任务开始后才能完成当前任务
}

/**
 * 任务依赖关系
 */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  dependencyType: DependencyType;
  createdAt: string;
}

/**
 * 任务依赖详情（包含被依赖任务的信息）
 */
export interface TaskDependencyDetail extends TaskDependency {
  dependsOnTask: {
    id: string;
    title: string;
    status: string;
  };
}

/**
 * 创建任务依赖请求
 */
export interface CreateTaskDependencyRequest {
  dependsOnId: string;
  dependencyType?: DependencyType;
}

/**
 * 任务依赖统计
 */
export interface TaskDependencyStats {
  blocking: number; // 阻塞当前任务的数量
  blockedBy: number; // 当前任务被阻塞的数量
}
