/**
 * 评审报告生成服务
 * 支持 PDF、Word、HTML 格式
 */

import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import { Packer, Paragraph, TextRun, Document, HeadingLevel } from 'docx'

export interface ReportData {
  review: {
    id: string
    title: string
    type: string
    status: string
    createdAt: string
  }
  materials: Array<{
    fileName: string
    fileType: string
    fileSize: number
  }>
  criteria: Array<{
    title: string
    description?: string
  }>
  risks: Array<{
    title: string
    category: string
    riskLevel: string
  }>
  summary: {
    short: string
    standard: string
    detailed: string
    keyPoints: string[]
    conclusion: string
  } | null
}

export async function getReportData(reviewId: string): Promise<ReportData> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      type: true,
      materials: true,
      criteria: true,
    },
  })

  if (!review) {
    throw new Error('评审不存在')
  }

  const summaryAnalysis = await prisma.reviewAiAnalysis.findFirst({
    where: { reviewId, analysisType: 'SUMMARY' },
  })

  let summary: ReportData['summary'] = null
  if (summaryAnalysis) {
    try {
      summary = JSON.parse(summaryAnalysis.result)
    } catch {
      // ignore
    }
  }

  const risks = await prisma.reviewAiAnalysis.findFirst({
    where: { reviewId, analysisType: 'RISK_IDENTIFICATION' },
  })

  let riskList: ReportData['risks'] = []
  if (risks) {
    try {
      const parsed = JSON.parse(risks.result)
      riskList = Array.isArray(parsed) ? parsed : []
    } catch {
      // ignore
    }
  }

  return {
    review: {
      id: review.id,
      title: review.title,
      type: review.type.displayName,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
    },
    materials: review.materials.map((m) => ({
      fileName: m.fileName,
      fileType: m.fileType,
      fileSize: m.fileSize,
    })),
    criteria: review.criteria.map((c) => ({
      title: c.title,
      description: c.description || undefined,
    })),
    risks: riskList,
    summary,
  }
}

export async function generatePdfReport(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(20).font('Helvetica-Bold').text(data.review.title, { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).font('Helvetica').text(`评审类型：${data.review.type}`, { align: 'center' })
    doc.text(`生成时间：${new Date().toLocaleString('zh-CN')}`, { align: 'center' })
    doc.moveDown(1)

    doc.fontSize(14).font('Helvetica-Bold').text('评审材料')
    doc.fontSize(10).font('Helvetica')
    data.materials.forEach((m, i) => {
      doc.text(`${i + 1}. ${m.fileName} (${m.fileType}, ${(m.fileSize / 1024).toFixed(2)} KB)`)
    })
    doc.moveDown(1)

    doc.fontSize(14).font('Helvetica-Bold').text('评审检查项')
    doc.fontSize(10).font('Helvetica')
    data.criteria.forEach((c, i) => {
      doc.text(`${i + 1}. ${c.title}`)
      if (c.description) {
        doc.text(`   ${c.description}`, { indent: 20 })
      }
    })
    doc.moveDown(1)

    if (data.risks.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('识别的风险')
      doc.fontSize(10).font('Helvetica')
      data.risks.forEach((r, i) => {
        doc.text(`${i + 1}. ${r.title} [${r.riskLevel}]`)
      })
      doc.moveDown(1)
    }

    if (data.summary) {
      doc.fontSize(14).font('Helvetica-Bold').text('评审摘要')
      doc.fontSize(10).font('Helvetica')
      doc.text(data.summary.standard)
      doc.moveDown(0.5)

      doc.fontSize(10).font('Helvetica-Bold').text('关键点:')
      doc.fontSize(10).font('Helvetica')
      data.summary.keyPoints.forEach((p, _i) => {
        doc.text(`• ${p}`)
      })
      doc.moveDown(0.5)

      doc.fontSize(10).font('Helvetica-Bold').text('结论:')
      doc.fontSize(10).font('Helvetica')
      doc.text(data.summary.conclusion)
    }

    doc.end()
  })
}

export async function generateDocxReport(data: ReportData): Promise<Uint8Array> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: data.review.title,
            heading: HeadingLevel.TITLE,
            alignment: 'center',
          }),
          new Paragraph({
            text: `评审类型：${data.review.type}`,
            alignment: 'center',
          }),
          new Paragraph({
            text: `生成时间：${new Date().toLocaleString('zh-CN')}`,
            alignment: 'center',
          }),
          new Paragraph({ text: '评审材料', heading: HeadingLevel.HEADING_1 }),
          ...data.materials.map(
            (m, i) =>
              new Paragraph({
                text: `${i + 1}. ${m.fileName} (${m.fileType}, ${(m.fileSize / 1024).toFixed(2)} KB)`,
              })
          ),
          new Paragraph({ text: '评审检查项', heading: HeadingLevel.HEADING_1 }),
          ...data.criteria.map(
            (c, i) =>
              new Paragraph({
                text: `${i + 1}. ${c.title}`,
              })
          ),
          ...(data.risks.length > 0
            ? [
                new Paragraph({ text: '识别的风险', heading: HeadingLevel.HEADING_1 }),
                ...data.risks.map(
                  (r, i) =>
                    new Paragraph({
                      text: `${i + 1}. ${r.title} [${r.riskLevel}]`,
                    })
                ),
              ]
            : []),
          ...(data.summary
            ? [
                new Paragraph({ text: '评审摘要', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: data.summary.standard }),
                new Paragraph({
                  children: [new TextRun({ text: '关键点:', bold: true })],
                }),
                ...data.summary.keyPoints.map(
                  (p) =>
                    new Paragraph({
                      children: [new TextRun(`• ${p}`)],
                    })
                ),
                new Paragraph({
                  children: [new TextRun({ text: '结论:', bold: true })],
                }),
                new Paragraph({ text: data.summary.conclusion }),
              ]
            : []),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}

export async function generateHtmlReport(data: ReportData): Promise<string> {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.review.title} - 评审报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { text-align: center; color: #1a1a1a; }
    h2 { color: #333; border-bottom: 2px solid #0070f3; padding-bottom: 8px; margin-top: 32px; }
    .meta { text-align: center; color: #666; margin-bottom: 32px; }
    .item { padding: 8px 0; border-bottom: 1px solid #eee; }
    .risk-HIGH, .risk-CRITICAL { color: #dc2626; font-weight: bold; }
    .risk-MEDIUM { color: #f59e0b; font-weight: bold; }
    .risk-LOW { color: #059669; }
    .summary { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>${data.review.title}</h1>
  <div class="meta"><p>评审类型：${data.review.type} | 生成时间：${new Date().toLocaleString('zh-CN')}</p></div>

  <h2>评审材料</h2>
  ${data.materials.map((m, i) => `<div class="item">${i + 1}. ${m.fileName} (${m.fileType}, ${(m.fileSize / 1024).toFixed(2)} KB)</div>`).join('')}

  <h2>评审检查项</h2>
  ${data.criteria.map((c, i) => `<div class="item"><strong>${i + 1}. ${c.title}</strong>${c.description ? `<p style="margin:4px 0 0 16px;color:#666">${c.description}</p>` : ''}</div>`).join('')}

  ${data.risks.length > 0 ? `<h2>识别的风险</h2>` + data.risks.map((r, i) => `<div class="item"><span class="risk-${r.riskLevel}">${i + 1}. ${r.title} [${r.riskLevel}]</span></div>`).join('') : ''}

  ${
    data.summary
      ? `
    <h2>评审摘要</h2>
    <div class="summary">
      <p>${data.summary.standard}</p>
      <h3>关键点</h3><ul>${data.summary.keyPoints.map((p) => `<li>${p}</li>`).join('')}</ul>
      <h3>结论</h3><p>${data.summary.conclusion}</p>
    </div>
  `
      : ''
  }
</body>
</html>`.trim()
}

export const reportGenerator = {
  getReportData,
  generatePdfReport,
  generateDocxReport,
  generateHtmlReport,
}
