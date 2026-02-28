// ============================================================================
// 角色选择器组件测试
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  ROLE_CONFIG,
  ALL_ROLES,
  PROJECT_ROLES,
  RoleSelect,
  RoleMultiSelect,
  RolePermissionPreview,
  RoleSearchSelect,
  type UserRole,
  type RoleSelectProps,
  type RoleMultiSelectProps,
  type RolePermissionPreviewProps,
  type RoleSearchSelectProps,
} from '@/components/users/role-select'

describe('RoleConfig 角色配置', () => {
  describe('角色枚举值', () => {
    it('应该包含所有 5 种角色', () => {
      expect(ALL_ROLES).toHaveLength(5)
      expect(ALL_ROLES).toContain('ADMIN')
      expect(ALL_ROLES).toContain('PROJECT_ADMIN')
      expect(ALL_ROLES).toContain('PROJECT_OWNER')
      expect(ALL_ROLES).toContain('PROJECT_MEMBER')
      expect(ALL_ROLES).toContain('EMPLOYEE')
    })

    it('项目角色应该排除 ADMIN', () => {
      expect(PROJECT_ROLES).toHaveLength(4)
      expect(PROJECT_ROLES).not.toContain('ADMIN')
      expect(PROJECT_ROLES).toContain('PROJECT_ADMIN')
      expect(PROJECT_ROLES).toContain('PROJECT_OWNER')
      expect(PROJECT_ROLES).toContain('PROJECT_MEMBER')
      expect(PROJECT_ROLES).toContain('EMPLOYEE')
    })
  })

  describe('角色配置详情', () => {
    it('ADMIN 应该有系统级配置', () => {
      const admin = ROLE_CONFIG.ADMIN
      expect(admin.label).toBe('系统管理员')
      expect(admin.level).toBe(5)
      expect(admin.permissions).toContain('系统管理')
      expect(admin.permissions).toContain('用户管理')
    })

    it('PROJECT_ADMIN 应该有项目管理配置', () => {
      const projectAdmin = ROLE_CONFIG.PROJECT_ADMIN
      expect(projectAdmin.label).toBe('项目管理员')
      expect(projectAdmin.level).toBe(4)
      expect(projectAdmin.permissions).toContain('成员管理')
      expect(projectAdmin.permissions).toContain('任务管理')
    })

    it('PROJECT_OWNER 应该有项目所有者配置', () => {
      const owner = ROLE_CONFIG.PROJECT_OWNER
      expect(owner.label).toBe('项目所有者')
      expect(owner.level).toBe(4)
      expect(owner.permissions).toContain('项目删除')
      expect(owner.permissions).toContain('成员管理')
    })

    it('PROJECT_MEMBER 应该有成员配置', () => {
      const member = ROLE_CONFIG.PROJECT_MEMBER
      expect(member.label).toBe('项目成员')
      expect(member.level).toBe(3)
      expect(member.permissions).toContain('任务查看')
      expect(member.permissions).toContain('任务更新')
    })

    it('EMPLOYEE 应该有基础配置', () => {
      const employee = ROLE_CONFIG.EMPLOYEE
      expect(employee.label).toBe('普通员工')
      expect(employee.level).toBe(1)
      expect(employee.permissions).toContain('需求提交')
    })
  })

  describe('角色权限级别', () => {
    it('权限级别应该按角色递增', () => {
      expect(ROLE_CONFIG.EMPLOYEE.level).toBe(1)
      expect(ROLE_CONFIG.PROJECT_MEMBER.level).toBe(3)
      expect(ROLE_CONFIG.PROJECT_ADMIN.level).toBe(4)
      expect(ROLE_CONFIG.PROJECT_OWNER.level).toBe(4)
      expect(ROLE_CONFIG.ADMIN.level).toBe(5)
    })
  })

  describe('角色描述', () => {
    it('每个角色都应该有描述', () => {
      ALL_ROLES.forEach((role) => {
        expect(ROLE_CONFIG[role].description).toBeDefined()
        expect(ROLE_CONFIG[role].description.length).toBeGreaterThan(0)
      })
    })

    it('每个角色都应该有图标', () => {
      ALL_ROLES.forEach((role) => {
        expect(ROLE_CONFIG[role].icon).toBeDefined()
      })
    })

    it('每个角色都应该有颜色样式', () => {
      ALL_ROLES.forEach((role) => {
        expect(ROLE_CONFIG[role].color).toBeDefined()
        expect(ROLE_CONFIG[role].bgColor).toBeDefined()
      })
    })
  })
})

describe('类型定义', () => {
  it('UserRole 应该是联合类型', () => {
    const roles: UserRole[] = [
      'ADMIN',
      'PROJECT_ADMIN',
      'PROJECT_OWNER',
      'PROJECT_MEMBER',
      'EMPLOYEE',
    ]
    expect(roles).toHaveLength(5)
  })

  it('RoleSelectProps 应该包含必要的属性', () => {
    const props: RoleSelectProps = {
      value: 'PROJECT_MEMBER',
      onValueChange: () => {},
      disabled: false,
      placeholder: '选择角色',
      excludeRoles: ['ADMIN'],
      showDescription: true,
    }
    expect(props.value).toBe('PROJECT_MEMBER')
    expect(props.onValueChange).toBeDefined()
    expect(props.excludeRoles).toContain('ADMIN')
  })

  it('RoleMultiSelectProps 应该包含必要的属性', () => {
    const props: RoleMultiSelectProps = {
      values: ['PROJECT_ADMIN', 'PROJECT_MEMBER'],
      onChange: () => {},
      disabled: false,
      placeholder: '选择角色',
      excludeRoles: ['ADMIN'],
    }
    expect(props.values).toHaveLength(2)
    expect(props.onChange).toBeDefined()
  })

  it('RolePermissionPreviewProps 应该包含必要的属性', () => {
    const props: RolePermissionPreviewProps = {
      role: 'PROJECT_OWNER',
      readOnly: true,
    }
    expect(props.role).toBe('PROJECT_OWNER')
    expect(props.readOnly).toBe(true)
  })

  it('RoleSearchSelectProps 应该包含必要的属性', () => {
    const props: RoleSearchSelectProps = {
      value: 'EMPLOYEE',
      onValueChange: () => {},
      disabled: false,
      placeholder: '搜索角色',
      excludeRoles: ['ADMIN'],
    }
    expect(props.value).toBe('EMPLOYEE')
    expect(props.onValueChange).toBeDefined()
  })
})

describe('权限映射一致性', () => {
  it('每个角色的权限列表应该非空', () => {
    ALL_ROLES.forEach((role) => {
      expect(ROLE_CONFIG[role].permissions.length).toBeGreaterThan(0)
    })
  })

  it('PROJECT_ADMIN 应该拥有 PROJECT_MEMBER 的所有权限', () => {
    const adminPermissions = ROLE_CONFIG.PROJECT_ADMIN.permissions
    const memberPermissions = ROLE_CONFIG.PROJECT_MEMBER.permissions

    // PROJECT_ADMIN 应该拥有更高级别的权限
    expect(adminPermissions).toContain('成员管理')
    expect(adminPermissions).toContain('任务管理')
  })

  it('PROJECT_OWNER 应该拥有所有项目级权限', () => {
    const ownerPermissions = ROLE_CONFIG.PROJECT_OWNER.permissions

    expect(ownerPermissions).toContain('项目删除')
    expect(ownerPermissions).toContain('成员管理')
    expect(ownerPermissions).toContain('任务管理')
    expect(ownerPermissions).toContain('需求管理')
  })

  it('ADMIN 应该拥有系统级权限', () => {
    const adminPermissions = ROLE_CONFIG.ADMIN.permissions

    expect(adminPermissions).toContain('系统管理')
    expect(adminPermissions).toContain('用户管理')
    expect(adminPermissions).toContain('所有项目管理')
    expect(adminPermissions).toContain('系统设置')
  })
})
