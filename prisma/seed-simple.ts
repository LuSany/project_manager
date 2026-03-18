import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充种子数据...')

  // 创建系统管理员
  const adminId = randomUUID()
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.users.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: adminId,
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: '系统管理员',
      status: 'ACTIVE',
      role: 'ADMIN',
      updatedAt: new Date(),
    },
  })
  console.log('✅ 创建系统管理员:', admin.email)

  // 创建测试用户
  const testUserId = randomUUID()
  const testPassword = await bcrypt.hash('test123', 10)
  const testUser = await prisma.users.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: testUserId,
      email: 'test@example.com',
      passwordHash: testPassword,
      name: '测试用户',
      status: 'ACTIVE',
      role: 'EMPLOYEE',
      updatedAt: new Date(),
    },
  })
  console.log('✅ 创建测试用户:', testUser.email)

  // 创建测试项目
  const projectId = randomUUID()
  const project = await prisma.projects.create({
    data: {
      id: projectId,
      name: '示例项目',
      description: '这是一个用于测试的示例项目',
      status: 'ACTIVE',
      ownerId: admin.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 天后
      updatedAt: new Date(),
    },
  })
  console.log('✅ 创建测试项目:', project.name)

  // 添加项目成员
  await prisma.project_members.create({
    data: {
      projects: { connect: { id: project.id } },
      users: { connect: { id: testUser.id } },
      role: 'PROJECT_MEMBER',
    },
  })
  console.log('✅ 添加项目成员:', testUser.email)

  // 创建里程碑
  const milestone1 = await prisma.milestones.create({
    data: {
      id: randomUUID(),
      title: '需求分析完成',
      description: '完成所有需求收集和分析工作',
      status: 'COMPLETED',
      progress: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projects: { connect: { id: project.id } },
      updatedAt: new Date(),
    },
  })

  const milestone2 = await prisma.milestones.create({
    data: {
      id: randomUUID(),
      title: '原型设计完成',
      description: '完成产品原型设计并通过评审',
      status: 'IN_PROGRESS',
      progress: 60,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      projects: { connect: { id: project.id } },
      updatedAt: new Date(),
    },
  })
  console.log('✅ 创建测试里程碑:', milestone1.title, milestone2.title)

  // 创建示例任务 - 移除 actualHours 和 completedAt 字段
  const task1 = await prisma.tasks.create({
    data: {
      id: randomUUID(),
      title: '设计登录页面',
      description: '实现用户登录功能的前端界面',
      status: 'DONE',
      progress: 100,
      priority: 'HIGH',
      projects: { connect: { id: project.id } },
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
      updatedAt: new Date(),
    },
  })

  const task2 = await prisma.tasks.create({
    data: {
      id: randomUUID(),
      title: '实现注册 API',
      description: '创建用户注册的后端 API 接口',
      status: 'IN_PROGRESS',
      progress: 30,
      priority: 'CRITICAL',
      projects: { connect: { id: project.id } },
      startDate: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      estimatedHours: 16,
      updatedAt: new Date(),
    },
  })

  const task3 = await prisma.tasks.create({
    data: {
      id: randomUUID(),
      title: '需求文档评审',
      description: '组织项目需求文档的评审会议',
      status: 'TODO',
      progress: 0,
      priority: 'MEDIUM',
      projects: { connect: { id: project.id } },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedHours: 4,
      updatedAt: new Date(),
    },
  })

  const task4 = await prisma.tasks.create({
    data: {
      id: randomUUID(),
      title: '数据库设计优化',
      description: '根据评审反馈优化数据库表结构',
      status: 'IN_PROGRESS',
      progress: 50,
      priority: 'HIGH',
      projects: { connect: { id: project.id } },
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimatedHours: 12,
      updatedAt: new Date(),
    },
  })

  // 分配任务执行人
  await prisma.task_assignees.create({
    data: {
      tasks: { connect: { id: task1.id } },
      users: { connect: { id: testUser.id } },
    },
  })
  await prisma.task_assignees.create({
    data: {
      tasks: { connect: { id: task2.id } },
      users: { connect: { id: testUser.id } },
    },
  })
  await prisma.task_assignees.create({
    data: {
      tasks: { connect: { id: task4.id } },
      users: { connect: { id: testUser.id } },
    },
  })
  console.log('✅ 创建测试任务并分配给:', testUser.email)

  // 创建测试风险
  const risk1 = await prisma.risks.create({
    data: {
      id: randomUUID(),
      projects: { connect: { id: project.id } },
      users: { connect: { id: admin.id } },
      title: '技术风险：新技术学习曲线陡峭',
      description: '团队对 Next.js 15 和 Prisma 6 不够熟悉，可能影响开发进度',
      category: 'TECHNICAL',
      probability: 3,
      impact: 3,
      riskLevel: 'MEDIUM',
      status: 'MITIGATING',
      progress: 40,
      mitigation: '组织技术培训，安排专家指导',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  })

  const risk2 = await prisma.risks.create({
    data: {
      id: randomUUID(),
      projects: { connect: { id: project.id } },
      users: { connect: { id: admin.id } },
      title: '进度风险：需求变更频繁',
      description: '业务方可能在开发过程中提出新的需求变更',
      category: 'MANAGEMENT',
      probability: 4,
      impact: 4,
      riskLevel: 'HIGH',
      status: 'IDENTIFIED',
      progress: 0,
      mitigation: '建立需求变更控制流程，定期与业务方确认需求',
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  })
  console.log('✅ 创建测试风险:', risk1.title, risk2.title)

  // 创建测试需求
  const req1 = await prisma.requirements.create({
    data: {
      id: randomUUID(),
      title: '用户登录功能',
      description: '实现用户登录、登出、记住我功能',
      status: 'APPROVED',
      priority: 'HIGH',
      projects: { connect: { id: project.id } },
      users: { connect: { id: admin.id } },
      reviewedAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const req2 = await prisma.requirements.create({
    data: {
      id: randomUUID(),
      title: '项目管理模块',
      description: '支持项目的创建、编辑、删除、成员管理',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projects: { connect: { id: project.id } },
      updatedAt: new Date(),
    },
  })
  console.log('✅ 创建测试需求:', req1.title, req2.title)

  console.log('\n✨ 种子数据填充完成！')
  console.log('\n测试账号:')
  console.log('  管理员账号：admin@example.com / admin123')
  console.log('  普通用户：test@example.com / test123')
}

main()
  .catch((e) => {
    console.error('填充种子数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
