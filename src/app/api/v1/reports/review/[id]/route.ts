import { NextRequest, NextResponse } from 'next/server'
import { reportGenerator } from '@/lib/services/report-generator'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const { id: reviewId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'

    const data = await reportGenerator.getReportData(reviewId)

    if (format === 'json') {
      return NextResponse.json({ success: true, data })
    }

    let body: ArrayBuffer | string
    let contentType: string
    let filename: string

    switch (format) {
      case 'pdf':
        const pdfBuffer = await reportGenerator.generatePdfReport(data)
        body = pdfBuffer.buffer as ArrayBuffer
        contentType = 'application/pdf'
        filename = `review-${reviewId}.pdf`
        break
      case 'docx':
        const docxBuffer = await reportGenerator.generateDocxReport(data)
        body = docxBuffer.buffer as ArrayBuffer
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `review-${reviewId}.docx`
        break
      case 'html':
        body = await reportGenerator.generateHtmlReport(data)
        contentType = 'text/html; charset=utf-8'
        filename = `review-${reviewId}.html`
        break
      default:
        return NextResponse.json(
          { error: '不支持的格式，支持：json, pdf, docx, html' },
          { status: 400 }
        )
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '报告生成失败' },
      { status: 500 }
    )
  }
}
