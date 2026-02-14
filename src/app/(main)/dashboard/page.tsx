export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">工作台</h1>

      {/* 快速统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">我的任务</h3>
          <p className="text-4xl font-bold text-primary">12</p>
          <p className="text-muted-foreground text-sm">待处理</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">进行中项目</h3>
          <p className="text-4xl font-bold text-primary">3</p>
          <p className="text-muted-foreground text-sm">个活跃项目</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">即将到期</h3>
          <p className="text-4xl font-bold text-destructive">2</p>
          <p className="text-muted-foreground text-sm">任务7天内到期</p>
        </div>
      </div>
    </div>
  );
}
