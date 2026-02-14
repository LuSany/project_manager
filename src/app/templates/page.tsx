"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";

interface Template {
  id: string;
  title: string;
  description: string | null;
  templateData: Record<string, unknown>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  description: string;
  templateData: string;
  isPublic: boolean;
}

export default function TemplatesPage() {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    templateData: "{}",
    isPublic: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 权限检查：只有管理员可以访问
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">您没有权限访问此页面</p>
      </div>
    );
  }

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedResponse<Template>>("/templates", {
        page,
        pageSize: 10,
      });

      if (response.success && response.data) {
        setTemplates(response.data.items);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.error?.message || "获取模板列表失败");
      }
    } catch (err) {
      console.error("获取模板列表失败:", err);
      setError("获取模板列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      title: "",
      description: "",
      templateData: "{}",
      isPublic: false,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || "",
      templateData: JSON.stringify(template.templateData, null, 2),
      isPublic: template.isPublic,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个模板吗？")) {
      return;
    }

    setDeleteId(id);
    try {
      const response = await api.delete(`/templates/${id}`);
      if (response.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        setError(response.error?.message || "删除模板失败");
      }
    } catch (err) {
      console.error("删除模板失败:", err);
      setError("删除模板失败");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSubmit = async () => {
    // 验证表单
    if (!formData.title.trim()) {
      setError("模板标题不能为空");
      return;
    }

    // 验证JSON
    try {
      JSON.parse(formData.templateData);
    } catch {
      setError("模板数据格式错误，请输入有效的JSON");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const templateData = JSON.parse(formData.templateData);
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        templateData,
        isPublic: formData.isPublic,
      };

      let response;
      if (editingTemplate) {
        response = await api.put(`/templates/${editingTemplate.id}`, payload);
      } else {
        response = await api.post("/templates", payload);
      }

      if (response.success) {
        setIsDialogOpen(false);
        fetchTemplates();
      } else {
        setError(response.error?.message || "操作失败");
      }
    } catch (err) {
      console.error("操作失败:", err);
      setError("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">任务模板</h1>
        <button
          onClick={handleCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          创建模板
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 模板列表表格 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium mb-2 text-muted-foreground">暂无模板</p>
            <p className="text-sm text-muted-foreground">创建您的第一个任务模板</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">标题</th>
                <th className="px-6 py-3 text-left text-sm font-medium">描述</th>
                <th className="px-6 py-3 text-left text-sm font-medium">公开</th>
                <th className="px-6 py-3 text-left text-sm font-medium">创建时间</th>
                <th className="px-6 py-3 text-right text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">{template.title}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {template.description || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {template.isPublic ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        公开
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        私有
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(template.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-primary hover:underline mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      disabled={deleteId === template.id}
                      className="text-destructive hover:underline disabled:opacity-50"
                    >
                      {deleteId === template.id ? "删除中..." : "删除"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 创建/编辑对话框 */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsDialogOpen(false)}
          />

          {/* 对话框内容 */}
          <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingTemplate ? "编辑模板" : "创建模板"}
              </h2>

              {/* 表单 */}
              <div className="space-y-4">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    标题 <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="请输入模板标题"
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={3}
                    placeholder="请输入模板描述"
                  />
                </div>

                {/* 模板数据 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    模板数据 (JSON) <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={formData.templateData}
                    onChange={(e) => setFormData({ ...formData, templateData: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm resize-none"
                    rows={10}
                    placeholder='{}'
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    请输入有效的JSON格式，例如: {`{"taskName": "示例任务", "priority": "HIGH"}`}
                  </p>
                </div>

                {/* 是否公开 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm">
                    公开模板（所有用户可见）
                  </label>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-md border border-border hover:bg-muted disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "提交中..." : editingTemplate ? "更新" : "创建"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
