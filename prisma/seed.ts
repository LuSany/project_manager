import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充种子数据...')

  // 创建系统管理员
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: '系统管理员',
      status: 'ACTIVE',
      role: 'ADMIN',
    },
  })
  console.log('✅ 创建系统管理员:', admin.email)

  // 创建测试用户
  const testPassword = await bcrypt.hash('test123', 10)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: testPassword,
      name: '测试用户',
      status: 'ACTIVE',
      role: 'EMPLOYEE',
    },
  })
  console.log('✅ 创建测试用户:', testUser.email)

  // 创建测试项目
  const project = await prisma.project.create({
    data: {
      name: '示例项目',
      description: '这是一个用于测试的示例项目',
      status: 'ACTIVE',
      ownerId: admin.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后
    },
  })
  console.log('✅ 创建测试项目:', project.name)

  // 添加项目成员
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: testUser.id,
      role: 'PROJECT_MEMBER',
    },
  })
  console.log('✅ 添加项目成员:', testUser.email)

  // 创建里程碑
  const milestone1 = await prisma.milestone.create({
    data: {
      title: '需求分析完成',
      description: '完成所有需求收集和分析工作',
      status: 'COMPLETED',
      progress: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projectId: project.id,
    },
  })

  const milestone2 = await prisma.milestone.create({
    data: {
      title: '原型设计完成',
      description: '完成产品原型设计并通过评审',
      status: 'IN_PROGRESS',
      progress: 60,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      projectId: project.id,
    },
  })
  console.log('✅ 创建测试里程碑:', milestone1.title, milestone2.title)

  // 创建示例任务
  const task1 = await prisma.task.create({
    data: {
      title: '设计登录页面',
      description: '实现用户登录功能的前端界面',
      status: 'DONE',
      progress: 100,
      priority: 'HIGH',
      projectId: project.id,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: '实现注册API',
      description: '创建用户注册的后端API接口',
      status: 'IN_PROGRESS',
      progress: 30,
      priority: 'CRITICAL',
      projectId: project.id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      estimatedHours: 16,
    },
  })

  // 分配任务执行人
  await prisma.taskAssignee.create({
    data: {
      taskId: task1.id,
      userId: testUser.id,
    },
  })
  await prisma.taskAssignee.create({
    data: {
      taskId: task2.id,
      userId: testUser.id,
    },
  })
  console.log('✅ 创建测试任务并分配给:', testUser.email)

  console.log('\n✨ 种子数据填充完成！')
  console.log('\n测试账号:')
  console.log('  管理员账号: admin@example.com / admin123')
  console.log('  普通用户: test@example.com / test123')
}

main()
  .catch((e) => {
    console.error('填充种子数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
