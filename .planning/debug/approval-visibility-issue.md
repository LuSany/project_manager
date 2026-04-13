---
status: investigating
trigger: "审批人无法看到自己负责的设备类型的待审批预订"
created: 2026-04-13T21:15:00+08:00
updated: 2026-04-13T21:20:00+08:00
---

## Current Focus

hypothesis: The PENDING status filter query in approval-records API has incorrect logic or the bookings status check is wrong
test: Trace through the complete query logic from approval_configs to bookings
expecting: Identify the exact point where bookings are filtered incorrectly
next_action: Check if approval_configs data exists and bookings have PENDING_APPROVAL status

## Symptoms

expected: 审批管理页面 /approvals 显示待审批的预订记录。审批人能看到自己负责的设备类型的待审批预订。
actual: 审批人无法看到自己负责的设备类型的待审批预订
errors: None reported
reproduction: Navigate to /approvals page as an approver who is configured for a device type
started: Unknown - discovered during UAT testing

## Eliminated

(None yet)

## Evidence

- timestamp: 2026-04-13T21:16:00+08:00
  checked: prisma/schema.prisma
  found: |
    - bookings model has deviceId, status (BookingStatus enum)
    - devices model has typeId (references device_types.id)
    - approval_configs model has deviceTypeId, approverIds (JSON string[][])
    - BookingStatus enum includes PENDING_APPROVAL
  implication: Schema structure is correct, relation names match

- timestamp: 2026-04-13T21:17:00+08:00
  checked: src/app/api/v1/approval-records/route.ts (lines 48-105)
  found: |
    PENDING status logic:
    1. Fetches all approval_configs
    2. Parses approverIds as JSON string[][]
    3. Flattens and checks if user.id is in the flattened array
    4. If match found, adds deviceTypeId to myDeviceTypeIds
    5. Queries bookings where status='PENDING_APPROVAL' AND devices.typeId IN myDeviceTypeIds
    6. THEN filters out bookings where user has ANY approval_record
  implication: Step 6 is problematic - see below

- timestamp: 2026-04-13T21:22:00+08:00
  checked: src/lib/approval-flow.ts startApprovalChain (lines 106-162)
  found: |
    When startApprovalChain is called:
    1. Updates booking status to 'PENDING_APPROVAL'
    2. Creates approval_records for level 1 approvers with:
       - approverId = the approver's user ID
       - action = 'PENDING'
       - level = 1
  implication: approval_records are created BEFORE the approver sees them

- timestamp: 2026-04-13T21:25:00+08:00
  checked: src/app/api/v1/approval-records/route.ts (lines 95-105)
  found: |
    The "processed" filter logic:
    ```
    const processedRecords = await db.approval_records.findMany({
      where: { approverId: user.id },
      select: { bookingId: true },
    })
    const processedBookingIds = processedRecords.map((r) => r.bookingId)
    const availableBookingIds = pendingBookingIds.filter(
      (id) => !processedBookingIds.includes(id)
    )
    ```
  implication: |
    BUG IDENTIFIED: This filter considers ALL approval_records with the user's ID as "processed".
    But approval_records with action='PENDING' are NOT processed - they ARE the pending approvals that should be shown!
    
    ROOT CAUSE: The filter incorrectly excludes bookings where:
    - There is an approval_record with approverId=user.id AND action='PENDING'
    - These are exactly the bookings the user should see and approve
    
    When startApprovalChain creates approval_records for level 1 approvers with action='PENDING',
    those records have approverId set. The filter then excludes these bookings because they have
    approval_records with the user's ID, even though action='PENDING' means they're still pending.

## Resolution

root_cause: |
  In approval-records/route.ts, the PENDING status query filters logic incorrectly excludes bookings 
  where the approver has an approval_record with action='PENDING'. The filter:
  ```
  const processedRecords = await db.approval_records.findMany({
    where: { approverId: user.id },
  })
  ```
  considers ALL approval_records with the user's ID as "processed". But when startApprovalChain() 
  creates approval_records, it sets action='PENDING' for level 1 approvers. These pending records 
  should NOT be filtered out - they ARE the pending approvals that should be displayed.
  
  The fix: Only filter out bookings where the user has approval_records with action != 'PENDING'
  (i.e., truly processed: APPROVED, REJECTED, or FORWARDED).
fix: Change the processed filter to exclude only truly processed records (action != 'PENDING')
verification: Check pending approvals display for configured approvers
files_changed: []