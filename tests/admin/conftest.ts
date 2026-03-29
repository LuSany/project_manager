export const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'ACTIVE',
  avatar: null,
  phone: null,
  department: null,
  position: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockUserFactory = {
  create: (overrides: Record<string, any> = {}) => ({
    id: `user-${Math.random().toString(36).slice(2, 9)}`,
    email: `user${Math.floor(Math.random() * 1000)}@test.com`,
    name: 'Test User',
    role: 'EMPLOYEE' as const,
    status: 'ACTIVE' as const,
    avatar: null,
    phone: null,
    department: 'Engineering',
    position: 'Developer',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
}

export const mockProjectFactory = {
  create: (overrides: Record<string, any> = {}) => ({
    id: `project-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Test Project',
    description: 'A test project',
    status: 'PLANNING' as const,
    ownerId: 'admin-1',
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
}
