import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { error } from '@/lib/api/response'
import * as crypto from 'crypto'
import { writeFile, rename, unlink } from 'fs/promises'
import { existsSync } from 'fs'

/**
 * POST /api/v1/files/onlyoffice-callback
 * 处理OnlyOffice Document Server的回调
 * 当用户在OnlyOffice中编辑并保存文档时，会调用此端点
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, status, url, users, token } = body

    // 验证token（如果配置了API密钥）
    const apiKey = process.env.ONLYOFFICE_API_KEY
    if (apiKey) {
      const expectedToken = crypto
        .createHmac('sha256', apiKey)
        .update(JSON.stringify(body))
        .digest('hex')

      if (token !== expectedToken) {
        console.error('OnlyOffice回调token验证失败')
        return error('INVALID_TOKEN', '无效的token', undefined, 403)
      }
    }

    // OnlyOffice回调状态码
    // 0 - 文档正在被编辑，但尚未保存
    // 1 - 文档已准备好保存
    // 2 - 文档保存失败
    // 3 - 文档保存时发生错误
    // 4 - 文档已关闭，没有变化
    // 6 - 文档正在被编辑，但尚未保存（强制保存）
    // 7 - 文档已成功保存（强制保存）

    if (status === 2 || status === 3) {
      console.error('OnlyOffice保存失败:', { key, status, url })
      return NextResponse.json({ error: 1 })
    }

    if (status === 4) {
      // 文档未修改，直接返回成功
      return NextResponse.json({ error: 0 })
    }

    if (status === 1 || status === 6 || status === 7) {
      if (!url) {
        console.error('OnlyOffice回调缺少下载URL')
        return NextResponse.json({ error: 1 })
      }

      const matchedFile = await prisma.file_storage.findFirst({
        where: { documentKey: key },
      })

      if (!matchedFile) {
        console.error('OnlyOffice回调找不到对应的文件:', key)
        return NextResponse.json({ error: 1 })
      }

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to download updated file: ${response.statusText}`)
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        const tempFilePath = `${matchedFile.filePath}.tmp`

        await writeFile(tempFilePath, buffer)

        await prisma.$transaction(async (tx) => {
          await tx.file_storage.update({
            where: { id: matchedFile.id },
            data: {
              fileSize: buffer.length,
              updatedAt: new Date(),
            },
          })

          await rename(tempFilePath, matchedFile.filePath)
        })

        console.log('OnlyOffice文件更新成功:', matchedFile.id)
        return NextResponse.json({ error: 0 })
      } catch (downloadError) {
        console.error('下载OnlyOffice更新文件失败:', downloadError)

        const tempFilePath = `${matchedFile.filePath}.tmp`
        if (existsSync(tempFilePath)) {
          await unlink(tempFilePath).catch(() => {})
        }

        return NextResponse.json({ error: 1 })
      }
    }

    // 状态0或其他状态，返回成功
    return NextResponse.json({ error: 0 })
  } catch (err) {
    console.error('处理OnlyOffice回调失败:', err)
    return error('INTERNAL_ERROR', '处理回调失败', undefined, 500)
  }
}
