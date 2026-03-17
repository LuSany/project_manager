import { prisma } from '@/lib/prisma'

const LOCK_DURATION_MS = 30 * 60 * 1000

export interface DocumentLock {
  locked: boolean
  lockedBy?: string
  lockedByName?: string
  expiresAt?: Date
}

export async function acquireDocumentLock(
  fileId: string,
  userId: string
): Promise<{ success: boolean; lock?: DocumentLock }> {
  const file = await prisma.fileStorage.findUnique({
    where: { id: fileId },
    include: { locker: { select: { id: true, name: true } } },
  })

  if (!file) {
    return { success: false }
  }

  if (file.lockedBy && file.lockExpiresAt && file.lockExpiresAt > new Date()) {
    if (file.lockedBy !== userId) {
      return {
        success: false,
        lock: {
          locked: true,
          lockedBy: file.lockedBy,
          lockedByName: file.locker?.name ?? undefined,
          expiresAt: file.lockExpiresAt ?? undefined,
        },
      }
    }
  }

  await prisma.fileStorage.update({
    where: { id: fileId },
    data: {
      lockedBy: userId,
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + LOCK_DURATION_MS),
    },
  })

  return { success: true }
}

export async function releaseDocumentLock(fileId: string, userId: string): Promise<void> {
  await prisma.fileStorage.updateMany({
    where: {
      id: fileId,
      lockedBy: userId,
    },
    data: {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  })
}

export async function extendDocumentLock(fileId: string, userId: string): Promise<boolean> {
  const result = await prisma.fileStorage.updateMany({
    where: {
      id: fileId,
      lockedBy: userId,
    },
    data: {
      lockExpiresAt: new Date(Date.now() + LOCK_DURATION_MS),
    },
  })

  return result.count > 0
}

export async function cleanupExpiredLocks(): Promise<number> {
  const result = await prisma.fileStorage.updateMany({
    where: {
      lockExpiresAt: { lt: new Date() },
    },
    data: {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  })

  return result.count
}
