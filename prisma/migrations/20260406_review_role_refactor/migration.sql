-- 评审角色系统重构迁移
-- 将 OBSERVER 和 SECRETARY 角色转换为 AUTHOR

-- 1. 更新现有数据：将 SECRETARY 和 OBSERVER 转为 AUTHOR
UPDATE review_participants
SET role = 'AUTHOR'
WHERE role IN ('SECRETARY', 'OBSERVER');

-- 2. 更新评审组成员（如果存在类似角色）
UPDATE review_group_members
SET role = 'AUTHOR'
WHERE role IN ('SECRETARY', 'OBSERVER');

-- 3. 修改枚举类型：移除旧角色，添加新角色
-- PostgreSQL 需要先删除枚举值，然后添加新值
ALTER TYPE "ReviewParticipantRole" ADD VALUE 'AUTHOR';

-- 注意：PostgreSQL 不支持直接删除枚举值
-- 需要创建新的枚举类型并替换
-- 以下是在应用层处理的说明：
-- OBSERVER 和 SECRETARY 角色已在代码中移除
-- 现有数据已转换为 AUTHOR
-- 新的枚举值 AUTHOR 已添加