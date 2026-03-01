import { afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';

// Clean up database after all tests
afterAll(async () => {
  try {
    // Delete in reverse order of dependencies
    await prisma.$executeRaw`DELETE FROM "ReviewTemplateItem"`;
    await prisma.$executeRaw`DELETE FROM "ReviewTemplate"`;
    await prisma.$executeRaw`DELETE FROM "Review"`;
    await prisma.$executeRaw`DELETE FROM "TaskDependency"`;
    await prisma.$executeRaw`DELETE FROM "Task"`;
    await prisma.$executeRaw`DELETE FROM "Requirement"`;
    await prisma.$executeRaw`DELETE FROM "Milestone"`;
    await prisma.$executeRaw`DELETE FROM "Issue"`;
    await prisma.$executeRaw`DELETE FROM "FileStorage"`;
    await prisma.$executeRaw`DELETE FROM "EmailLog"`;
    await prisma.$executeRaw`DELETE FROM "EmailConfig"`;
    await prisma.$executeRaw`DELETE FROM "ProjectMember"`;
    await prisma.$executeRaw`DELETE FROM "Project"`;
    await prisma.$executeRaw`DELETE FROM "User"`;
  } catch (error) {
    console.error('Database cleanup failed:', error);
  }
});
