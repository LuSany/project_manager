// ============================================================================
// 任务关注者类型定义
// ============================================================================

export interface TaskWatcher {
  taskId: string;
  userId: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface AddWatcherRequest {
  userId: string;
}

export interface WatcherResponse {
  success: boolean;
  data?: TaskWatcher;
  error?: string;
}

export interface WatchersListResponse {
  success: boolean;
  data?: TaskWatcher[];
  error?: string;
}
