import { faker } from "@faker-js/faker/locale/zh_CN";

/**
 * 测试数据工厂
 */

export const userFactory = {
  create(overrides: Partial<User> = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: "REGULAR",
      status: "ACTIVE",
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      passwordHash: "hashed-password",
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  },

  createMany(count: number, overrides: Partial<User> = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  },
};

export const projectFactory = {
  create(overrides: Partial<Project> = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      status: "ACTIVE",
      ownerId: faker.string.uuid(),
      startDate: faker.date.recent(),
      endDate: faker.date.future(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  },

  createMany(count: number, overrides: Partial<Project> = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  },
};

export const taskFactory = {
  create(overrides: Partial<Task> = {}) {
    return {
      id: faker.string.uuid(),
      title: faker.hacker.phrase(),
      description: faker.lorem.paragraph(),
      status: "TODO",
      progress: 0,
      priority: "MEDIUM",
      projectId: faker.string.uuid(),
      startDate: faker.date.recent(),
      dueDate: faker.date.future(),
      estimatedHours: faker.number.int({ min: 1, max: 40 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  },

  createMany(count: number, overrides: Partial<Task> = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  },
};

// Type helpers
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  avatar?: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  ownerId: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  priority: string;
  projectId: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  createdAt: Date;
  updatedAt: Date;
}
