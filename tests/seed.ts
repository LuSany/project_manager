import { prisma } from '../src/lib/prisma';

// 创建默认的评审类型配置
export async function seedReviewTypes() {
  const reviewTypes = [
    { name: 'FEASIBILITY', displayName: '可行性评审' },
    { name: 'MILESTONE', displayName: '里程碑评审' },
    { name: 'TEST_PLAN', displayName: '测试计划评审' },
    { name: 'TEST_REPORT', displayName: '测试报告评审' },
    { name: 'TEST_RELEASE', displayName: '发布评审' },
    { name: 'REQUIREMENT', displayName: '需求评审' },
    { name: 'DESIGN', displayName: '设计评审' },
    { name: 'CODE', displayName: '代码评审' },
  ];

  for (const reviewType of reviewTypes) {
    await prisma.reviewTypeConfig.upsert({
      where: { name: reviewType.name },
      update: {},
      create: {
        name: reviewType.name,
        displayName: reviewType.displayName,
        isSystem: true,
        isActive: true,
      },
    });
  }
}

if (require.main === module) {
  seedReviewTypes().then(() => {
    console.log('Review types seeded successfully');
    process.exit(0);
  }).catch(err => {
    console.error('Failed to seed review types:', err);
    process.exit(1);
  });
}
