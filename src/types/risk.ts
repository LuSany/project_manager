// 风险类型定义
export interface Risk {
  id: string;
  title: string;
  description: string | null;
  category: RiskCategory;
  probability: number; // 1-5
  impact: number; // 1-5
  riskLevel: RiskLevel; // 计算得出: probability × impact
  status: RiskStatus;
  owner: string | null;
  dueDate: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export type RiskCategory = "TECHNICAL" | "RESOURCE" | "SCHEDULE" | "BUDGET" | "EXTERNAL" | "OTHER";

export type RiskStatus = "OPEN" | "ANALYZING" | "MITIGATING" | "CLOSED" | "ACCEPTED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  TECHNICAL: "技术风险",
  RESOURCE: "资源风险",
  SCHEDULE: "进度风险",
  BUDGET: "预算风险",
  EXTERNAL: "外部风险",
  OTHER: "其他",
};

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  OPEN: "未处理",
  ANALYZING: "分析中",
  MITIGATING: "缓解中",
  CLOSED: "已关闭",
  ACCEPTED: "已接受",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重",
};

export const RISK_STATUS_COLORS: Record<RiskStatus, string> = {
  OPEN: "bg-gray-100 text-gray-800 border-gray-200",
  ANALYZING: "bg-blue-100 text-blue-800 border-blue-200",
  MITIGATING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CLOSED: "bg-green-100 text-green-800 border-green-200",
  ACCEPTED: "bg-purple-100 text-purple-800 border-purple-200",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
};

// 计算风险等级
export function calculateRiskLevel(probability: number, impact: number): RiskLevel {
  const score = probability * impact;
  if (score <= 4) return "LOW";
  if (score <= 9) return "MEDIUM";
  if (score <= 16) return "HIGH";
  return "CRITICAL";
}
