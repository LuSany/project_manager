import { NextRequest, NextResponse } from 'next/server';
import { success, error } from '@/lib/api/response';

// GET /api/v1/email/templates - 获取邮件模板列表
export async function GET(request: NextRequest) {
  try {
    const templates = [
      {
        id: 'welcome',
        name: '欢迎邮件',
        subject: '欢迎加入项目管理系统',
        description: '新用户注册时发送'
      },
      {
        id: 'task_assigned',
        name: '任务分配',
        subject: '您有新任务分配',
        description: '任务分配给执行人时发送'
      },
      {
        id: 'review_invite',
        name: '评审邀请',
        subject: '您被邀请参与评审',
        description: '邀请用户参与评审时发送'
      },
      {
        id: 'risk_alert',
        name: '风险预警',
        subject: '项目风险预警',
        description: '风险等级变化时发送'
      }
    ];

    return NextResponse.json(success(templates));
  } catch (err) {
    console.error('获取邮件模板失败:', err);
    return NextResponse.json(error('获取邮件模板失败', 500));
  }
}

// POST /api/v1/email/templates - 创建邮件模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, description } = body;

    if (!name || !subject) {
      return NextResponse.json(error('名称和主题不能为空', 400));
    }

    const template = {
      id: Date.now().toString(),
      name,
      subject,
      description: description || '',
    };

    return NextResponse.json(success(template));
  } catch (err) {
    console.error('创建邮件模板失败:', err);
    return NextResponse.json(error('创建邮件模板失败', 500));
  }
}
