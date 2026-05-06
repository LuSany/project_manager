// CSV解析函数
export function parseCSV(text: string): Record<string, unknown>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV文件至少需要包含标题行和一行数据')
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseCSVLine(lines[0])
  const data: Record<string, unknown>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, unknown> = {}

    headers.forEach((header, index) => {
      const value = values[index] || ''
      if (value === 'true') row[header] = true
      else if (value === 'false') row[header] = false
      else if (!isNaN(Number(value)) && value !== '') row[header] = Number(value)
      else row[header] = value
    })

    data.push(row)
  }

  return data
}

// 根据文件类型解析数据
export async function parseTemplateFile(file: File): Promise<Record<string, unknown>[] | null> {
  const text = await file.text()
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.json')) {
    try {
      const data = JSON.parse(text)
      if (!Array.isArray(data)) {
        throw new Error('JSON文件需要包含数组格式数据')
      }
      return data
    } catch {
      throw new Error('无法解析JSON文件')
    }
  }

  if (fileName.endsWith('.csv')) {
    try {
      return parseCSV(text)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '无法解析CSV文件')
    }
  }

  throw new Error('不支持的文件格式，请使用JSON或CSV文件')
}