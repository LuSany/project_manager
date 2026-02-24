// 评分标准类型定义
export interface ReviewCriterion {
  id: string;
  reviewId: string;
  title: string;
  description: string | null;
  weight: number; // 权重
  maxScore: number; // 最高分数
  order: number; // 排序
  createdAt: string;
}

// 创建评分标准
export interface CreateReviewCriterionInput {
  title: string;
  description?: string;
  weight?: number;
  maxScore?: number;
  order?: number;
}

// 更新评分标准
export interface UpdateReviewCriterionInput {
  title?: string;
  description?: string;
  weight?: number;
  maxScore?: number;
  order?: number;
}
