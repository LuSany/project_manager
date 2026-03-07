import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock API client
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        department: '技术部',
        position: '工程师',
        phone: '123456789',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    }),
    put: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      department: '技术部',
      position: '工程师',
      phone: '123456789',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    },
    updateUser: vi.fn(),
  }),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染个人资料表单', async () => {
    const ProfilePage = (await import('@/app/(main)/settings/profile/page')).default;
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('个人资料')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('姓名')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('部门')).toBeInTheDocument();
    expect(screen.getByLabelText('职位')).toBeInTheDocument();
  });

  it('应显示用户当前数据', async () => {
    const ProfilePage = (await import('@/app/(main)/settings/profile/page')).default;
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('技术部')).toBeInTheDocument();
    expect(screen.getByDisplayValue('工程师')).toBeInTheDocument();
  });

  it('邮箱字段应被禁用', async () => {
    const ProfilePage = (await import('@/app/(main)/settings/profile/page')).default;
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('邮箱')).toBeDisabled();
    });
  });

  it('应能修改姓名', async () => {
    const ProfilePage = (await import('@/app/(main)/settings/profile/page')).default;
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('姓名')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('姓名');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(nameInput).toHaveValue('New Name');
  });

  it('应能修改部门', async () => {
    const ProfilePage = (await import('@/app/(main)/settings/profile/page')).default;
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('部门')).toBeInTheDocument();
    });

    const deptInput = screen.getByLabelText('部门');
    fireEvent.change(deptInput, { target: { value: '产品部' } });

    expect(deptInput).toHaveValue('产品部');
  });

  it('应能提交表单', async () => {
    const ProfilePage = (await import('@/app/(main)/settings/profile/page')).default;
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('姓名')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('姓名');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByText('保存更改');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('保存成功')).toBeInTheDocument();
    });
  });

  it('应显示加载状态', async () => {
    const { api } = await import('@/lib/api/client');
    vi.mocked(api.put).mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    const ProfilePage = (await import('@/app/(main)/settings/profile/page')).default;
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('姓名')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('姓名');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const submitButton = screen.getByText('保存更改');
    fireEvent.click(submitButton);

    // 验证加载状态
    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument();
    });
  });
});

describe('NotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染通知偏好表单', async () => {
    const PreferencesPage = (await import('@/app/(main)/settings/preferences/page')).default;
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('通知偏好')).toBeInTheDocument();
    });

    expect(screen.getByText('通知渠道')).toBeInTheDocument();
    expect(screen.getByText('通知类型')).toBeInTheDocument();
  });

  it('应显示邮件通知开关', async () => {
    const PreferencesPage = (await import('@/app/(main)/settings/preferences/page')).default;
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('邮件通知')).toBeInTheDocument();
    });

    expect(screen.getByRole('switch', { name: /邮件通知/i })).toBeInTheDocument();
  });

  it('应显示站内通知开关', async () => {
    const PreferencesPage = (await import('@/app/(main)/settings/preferences/page')).default;
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('站内通知')).toBeInTheDocument();
    });

    expect(screen.getByRole('switch', { name: /站内通知/i })).toBeInTheDocument();
  });

  it('应能切换通知开关', async () => {
    const PreferencesPage = (await import('@/app/(main)/settings/preferences/page')).default;
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /邮件通知/i })).toBeInTheDocument();
    });

    const emailSwitch = screen.getByRole('switch', { name: /邮件通知/i });
    const initialState = emailSwitch.getAttribute('data-state');

    fireEvent.click(emailSwitch);

    await waitFor(() => {
      expect(screen.getByText('保存成功')).toBeInTheDocument();
    });
  });

  it('应显示任务通知类型开关', async () => {
    const PreferencesPage = (await import('@/app/(main)/settings/preferences/page')).default;
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('任务到期提醒')).toBeInTheDocument();
    });

    expect(screen.getByText('任务分配通知')).toBeInTheDocument();
  });

  it('应显示摘要通知选项', async () => {
    const PreferencesPage = (await import('@/app/(main)/settings/preferences/page')).default;
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('摘要通知')).toBeInTheDocument();
    });

    expect(screen.getByText('每日摘要')).toBeInTheDocument();
    expect(screen.getByText('每周摘要')).toBeInTheDocument();
  });
});
