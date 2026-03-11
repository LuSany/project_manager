"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Upload, Download } from "lucide-react";
import type { TaskImportResult } from "@/types/task-template";

interface TaskImportDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface TemplateTask {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
}

export function TaskImportDialog({ projectId, open, onOpenChange, onSuccess }: TaskImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [importMethod, setImportMethod] = useState<"template" | "file" | "json">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("__none__");
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [templates, setTemplates] = useState<Array<{ id: string; title: string }>>([]);
  const [milestones, setMilestones] = useState<Array<{ id: string; title: string }>>([]);
  const [previewData, setPreviewData] = useState<TemplateTask[] | null>(null);

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/v1/templates?isPublic=true");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.items);
      }
    } catch (error) {
      console.error("加载模板失败:", error);
    }
  };

  // 加载里程碑列表
  const loadMilestones = async () => {
    try {
      const response = await fetch(`/api/v1/milestones?projectId=${projectId}`);
      const data = await response.json();
      if (data.success) {
        setMilestones(data.data.items || []);
      }
    } catch (error) {
      console.error("加载里程碑失败:", error);
    }
  };

  // 处理模板选择变化
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      try {
        const response = await fetch(`/api/v1/templates/${templateId}`);
        const data = await response.json();
        if (data.success && data.data.templateData) {
          setPreviewData(data.data.templateData.tasks || []);
        }
      } catch (error) {
        console.error("加载模板详情失败:", error);
      }
    } else {
      setPreviewData(null);
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // 如果是JSON文件，预览内容
      if (selectedFile.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            const tasks = Array.isArray(json) ? json : json.tasks;
            setPreviewData(tasks || []);
          } catch {
            setPreviewData(null);
          }
        };
        reader.readAsText(selectedFile);
      }
    }
  };

  // 处理JSON文本变化
  const handleJsonTextChange = (text: string) => {
    setJsonText(text);
    try {
      const json = JSON.parse(text);
      const tasks = Array.isArray(json) ? json : json.tasks;
      setPreviewData(tasks || []);
    } catch {
      setPreviewData(null);
    }
  };

  // 下载模板文件
  const downloadTemplate = () => {
    const template = {
      tasks: [
        {
          title: "示例任务1",
          description: "任务描述",
          priority: "HIGH",
          estimatedHours: 8,
        },
        {
          title: "示例任务2",
          description: "另一个任务描述",
          priority: "MEDIUM",
        },
      ],
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "task-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 执行导入
  const handleImport = async () => {
    setLoading(true);

    try {
      let result: TaskImportResult;

      if (importMethod === "template") {
        if (!selectedTemplateId) {
          alert("请选择模板");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/v1/tasks/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: selectedTemplateId,
            projectId,
            milestoneId: selectedMilestoneId === "__none__" ? undefined : selectedMilestoneId,
          }),
        });
        const data = await response.json();
        
        if (!data.success) {
          alert(data.error?.message || "导入失败");
          setLoading(false);
          return;
        }
        
        result = data.data;
      } else if (importMethod === "file") {
        if (!file) {
          alert("请选择文件");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);
        if (selectedMilestoneId && selectedMilestoneId !== "__none__") {
          formData.append("milestoneId", selectedMilestoneId);
        }

        const response = await fetch("/api/v1/tasks/import", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        
        if (!data.success) {
          alert(data.error?.message || "导入失败");
          setLoading(false);
          return;
        }
        
        result = data.data;
      } else {
        if (!jsonText) {
          alert("请输入JSON数据");
          setLoading(false);
          return;
        }

        const json = JSON.parse(jsonText);
        const response = await fetch("/api/v1/tasks/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: Array.isArray(json) ? json : json.tasks,
            projectId,
            milestoneId: selectedMilestoneId === "__none__" ? undefined : selectedMilestoneId,
          }),
        });
        const data = await response.json();
        
        if (!data.success) {
          alert(data.error?.message || "导入失败");
          setLoading(false);
          return;
        }
        
        result = data.data;
      }

      // 显示导入结果
      alert(
        `导入完成！\n成功: ${result.created}\n失败: ${result.failed}${result.errors?.length ? '\n错误: ' + result.errors.map(e => `${e.task}: ${e.error}`).join('\n') : ''}`
      );

      if (result.created > 0) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("导入失败:", error);
      alert("导入失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 当对话框打开时加载数据
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      loadTemplates();
      loadMilestones();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>导入任务</DialogTitle>
          <DialogDescription>
            从模板或文件导入任务到项目
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 导入方式选择 */}
          <div>
            <Label>导入方式</Label>
            <Select value={importMethod} onValueChange={(v: any) => setImportMethod(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">从模板导入</SelectItem>
                <SelectItem value="file">上传文件</SelectItem>
                <SelectItem value="json">粘贴JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 里程碑选择 */}
          <div>
            <Label htmlFor="milestone">关联里程碑（可选）</Label>
            <Select value={selectedMilestoneId} onValueChange={setSelectedMilestoneId}>
              <SelectTrigger id="milestone" className="mt-1">
                <SelectValue placeholder="选择里程碑" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">不关联</SelectItem>
                {milestones.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 从模板导入 */}
          {importMethod === "template" && (
            <div>
              <Label htmlFor="template">选择模板</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template" className="mt-1">
                  <SelectValue placeholder="选择任务模板" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 上传文件 */}
          {importMethod === "file" && (
            <div>
              <Label htmlFor="file">选择文件</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".json,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={downloadTemplate}
                  title="下载模板"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                支持 .json, .xlsx, .xls 格式
              </p>
            </div>
          )}

          {/* 粘贴JSON */}
          {importMethod === "json" && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="json">JSON数据</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={downloadTemplate}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  下载模板
                </Button>
              </div>
              <textarea
                id="json"
                value={jsonText}
                onChange={(e) => handleJsonTextChange(e.target.value)}
                placeholder='{"tasks": [{"title": "任务标题", "priority": "HIGH"}]}'
                className="mt-1 w-full h-40 px-3 py-2 border rounded-md text-sm font-mono"
              />
            </div>
          )}

          {/* 预览 */}
          {previewData && previewData.length > 0 && (
            <div>
              <Label>预览 ({previewData.length} 个任务)</Label>
              <div className="mt-1 border rounded-md p-3 max-h-40 overflow-y-auto bg-gray-50">
                {previewData.map((task, index) => (
                  <div key={index} className="text-sm py-1 border-b last:border-0">
                    <span className="font-medium">{task.title}</span>
                    {task.priority && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={handleImport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
