import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          email: 'test1@example.com',
          name: 'Test User 1',
          department: '技术部',
          position: '工程师',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          email: 'test2@example.com',
          name: 'Test User 2',
          department: '产品部',
          position: '产品经理',
          role: 'PROJECT_OWNER',
          status: 'PENDING',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ],
    }),
    put: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
}));

describe('Admin Users Table', () => {
  it('应渲染用户表格', async () => {
    // 动态导入组件
    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText(/用户管理/)).toBeInTheDocument();
    });

    // 验证表格存在
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('应显示用户数据', async () => {
    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    });
  });

  it('应显示状态筛选器', async () => {
    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('全部状态')).toBeInTheDocument();
    });
  });

  it('应显示搜索框', async () => {
    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索用户...')).toBeInTheDocument();
    });
  });

  it('应能按状态筛选', async () => {
    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('全部状态')).toBeInTheDocument();
    });

    // 选择状态筛选
    const statusSelect = screen.getByText('全部状态');
    fireEvent.click(statusSelect);

    // 验证选项存在
    expect(screen.getByText('待审批')).toBeInTheDocument();
    expect(screen.getByText('已激活')).toBeInTheDocument();
    expect(screen.getByText('已禁用')).toBeInTheDocument();
  });

  it('应显示审批按钮对待审批用户', async () => {
    const { api } = await import('@/lib/api/client');
    vi.mocked(api.get).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: '1',
          email: 'pending@example.com',
          name: 'Pending User',
          department: null,
          position: null,
          role: 'EMPLOYEE',
          status: 'PENDING',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
      expect(screen.getByText('审批通过')).toBeInTheDocument();
    });
  });

  it('应显示禁用按钮对已激活用户', async () => {
    const { api } = await import('@/lib/api/client');
    vi.mocked(api.get).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: '1',
          email: 'active@example.com',
          name: 'Active User',
          department: null,
          position: null,
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Active User')).toBeInTheDocument();
      expect(screen.getByText('禁用')).toBeInTheDocument();
    });
  });

  it('应显示启用按钮对已禁用用户', async () => {
    const { api } = await import('@/lib/api/client');
    vi.mocked(api.get).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: '1',
          email: 'disabled@example.com',
          name: 'Disabled User',
          department: null,
          position: null,
          role: 'EMPLOYEE',
          status: 'DISABLED',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const UsersPage = (await import('@/app/(main)/admin/users/page')).default;
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Disabled User')).toBeInTheDocument();
      expect(screen.getByText('启用')).toBeInTheDocument();
    });
  });
});
