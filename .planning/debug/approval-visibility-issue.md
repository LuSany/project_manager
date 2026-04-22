---
status: resolved
trigger: "审批人无法看到自己负责的设备类型的待审批预订"
created: 2026-04-13T21:15:00+08:00
updated: 2026-04-22T00:00:00+08:00
---

## Resolution

root_cause: |
  In approval-records/route.ts, the PENDING status query filters logic incorrectly excluded bookings 
  where the approver has an approval_record with action='PENDING'. The original filter:
  ```
  const processedRecords = await db.approval_records.findMany({
    where: { approverId: user.id },
  })
  ```
  considered ALL approval_records with the user's ID as "processed". But when startApprovalChain() 
  creates approval_records, it sets action='PENDING' for level 1 approvers. These pending records 
  should NOT be filtered out - they ARE the pending approvals that should be displayed.

fix: Change the processed filter to exclude only truly processed records (action != 'PENDING')
  ```
  const processedRecords = await db.approval_records.findMany({
    where: {
      approverId: user.id,
      action: { not: 'PENDING' }
    },
  })
  ```

verification: Code already has the fix at lines 97-101
files_changed: [src/app/api/v1/approval-records/route.ts]

## Status

✅ 已修复 - route.ts 第97-101行已包含 `action: { not: 'PENDING' }` 过滤条件