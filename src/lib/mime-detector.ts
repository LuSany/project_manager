import { open } from 'fs/promises'

const FILE_SIGNATURES: { [key: string]: { signature: number[]; offset: number; mime: string }[] } =
  {
    pdf: [{ signature: [0x25, 0x50, 0x44, 0x46], offset: 0, mime: 'application/pdf' }],
    png: [
      { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0, mime: 'image/png' },
    ],
    jpeg: [{ signature: [0xff, 0xd8, 0xff], offset: 0, mime: 'image/jpeg' }],
    gif: [
      { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0, mime: 'image/gif' },
      { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0, mime: 'image/gif' },
    ],
    webp: [{ signature: [0x52, 0x49, 0x46, 0x46], offset: 0, mime: 'image/webp' }],
    zip: [{ signature: [0x50, 0x4b, 0x03, 0x04], offset: 0, mime: 'application/zip' }],
    docx: [
      {
        signature: [0x50, 0x4b, 0x03, 0x04],
        offset: 0,
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ],
    xlsx: [
      {
        signature: [0x50, 0x4b, 0x03, 0x04],
        offset: 0,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
    pptx: [
      {
        signature: [0x50, 0x4b, 0x03, 0x04],
        offset: 0,
        mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
    ],
    doc: [
      {
        signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
        offset: 0,
        mime: 'application/msword',
      },
    ],
    xls: [
      {
        signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
        offset: 0,
        mime: 'application/vnd.ms-excel',
      },
    ],
    ppt: [
      {
        signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
        offset: 0,
        mime: 'application/vnd.ms-powerpoint',
      },
    ],
  }

export async function detectMimeType(filePath: string): Promise<string | null> {
  try {
    const handle = await open(filePath, 'r')
    const buffer = Buffer.alloc(512)
    await handle.read(buffer, 0, 512, 0)
    await handle.close()

    for (const [, signatures] of Object.entries(FILE_SIGNATURES)) {
      for (const { signature, offset, mime } of signatures) {
        if (matchesSignature(buffer, signature, offset)) {
          return mime
        }
      }
    }

    return null
  } catch {
    return null
  }
}

function matchesSignature(buffer: Buffer, signature: number[], offset: number): boolean {
  if (buffer.length < offset + signature.length) {
    return false
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) {
      return false
    }
  }

  return true
}

export function getExtensionFromMime(mimeType: string): string {
  const mimeToExtension: { [key: string]: string } = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/zip': 'zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/msword': 'doc',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.ms-powerpoint': 'ppt',
    'text/plain': 'txt',
    'text/csv': 'csv',
  }

  return mimeToExtension[mimeType] || ''
}

export function isAllowedMimeType(mimeType: string): boolean {
  const allowedMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'text/plain',
    'text/csv',
  ]

  return allowedMimeTypes.includes(mimeType)
}

export async function validateFileMimeType(
  filePath: string,
  declaredMimeType: string
): Promise<{ valid: boolean; detectedMimeType: string | null; reason?: string }> {
  const detectedMimeType = await detectMimeType(filePath)

  if (!detectedMimeType) {
    return { valid: true, detectedMimeType: null }
  }

  if (detectedMimeType !== declaredMimeType) {
    return {
      valid: false,
      detectedMimeType,
      reason: `声明的 MIME 类型 "${declaredMimeType}" 与检测到的 "${detectedMimeType}" 不匹配`,
    }
  }

  return { valid: true, detectedMimeType }
}
