import { describe, expect, it } from 'vitest'
import { DocumentParserFactory } from '../document/parsers/DocumentParserFactory'
import { documentService } from '../document/services/documentService'
import type { DocumentFormat, DocumentSource } from '../document/types'
import { cleanBullet, cleanText } from '../document/utils/cleanText'
import { detectRetailSignals } from '../document/utils/retailHeuristics'

const source = (format: DocumentFormat): DocumentSource => ({ id: `source-${format}`, fileName: `training.${format === 'markdown' ? 'md' : format}`, mimeType: '', size: 100, format, importedAt: '2026-07-19T00:00:00.000Z' })
const file = (content: string, name: string, type: string) => ({ name, type, size: content.length, text: async () => content, arrayBuffer: async () => new TextEncoder().encode(content).buffer }) as File

describe('Document Intelligence Pipeline', () => {
  it('factory selects a dedicated parser without a caller-side format switch', () => {
    const factory = new DocumentParserFactory()
    expect(factory.get(source('txt')).id).toBe('txt-parser-v1')
    expect(factory.get(source('markdown')).id).toBe('markdown-parser-v1')
    expect(factory.get(source('pdf')).id).toBe('pdf-placeholder-v1')
    expect(factory.get(source('pptx')).id).toBe('pptx-placeholder-v1')
    expect(factory.get(source('docx')).id).toBe('docx-placeholder-v1')
  })

  it('parses TXT headings, paragraphs, blank lines, bullets and numbered lists', async () => {
    const text = 'TƯ VẤN MAC\n\nNội dung đào tạo nhân viên tại cửa hàng.\n\n- Khám phá nhu cầu\n• Xác nhận ngân sách\n\n1. Hỏi khách hàng\n2. Đề xuất sản phẩm'
    const document = await documentService.parseFile(file(text, 'training.txt', 'text/plain'))
    const elements = document.pages[0]!.sections.flatMap((section) => section.elements)
    expect(document.status).toBe('parsed')
    expect(document.pages[0]!.sections[0]!.title).toBe('TƯ VẤN MAC')
    expect(elements.some((item) => item.type === 'paragraph')).toBe(true)
    expect(elements.filter((item) => item.type === 'list')).toHaveLength(2)
    expect(elements.some((item) => item.type === 'blank_line')).toBe(true)
  })

  it('parses Markdown structure without rendering HTML', async () => {
    const markdown = '# Product Training\n\n## Lưu ý tư vấn\n\n> Không bịa giá bán.\n\n- Hỏi nhu cầu\n- Kiểm tra cấu hình\n\n![Ảnh máy](https://example.com/mac.png "Mac")\n\n| Nhu cầu | Gợi ý |\n| --- | --- |\n| Di chuyển | Máy nhẹ |\n\n```txt\nTrainer note\n```'
    const document = await documentService.parseFile(file(markdown, 'training.md', 'text/markdown'))
    const elements = document.pages[0]!.sections.flatMap((section) => section.elements)
    expect(document.pages[0]!.sections.map((section) => section.title)).toEqual(['Product Training', 'Lưu ý tư vấn'])
    expect(elements.map((item) => item.type)).toEqual(expect.arrayContaining(['quote', 'list', 'image', 'table', 'code']))
    expect(document.normalizedText).not.toContain('<h1>')
  })

  it('cleans unicode spaces, duplicate whitespace and malformed bullets', () => {
    expect(cleanText('  Giá\u00a0 bán   \n\n\n  Lưu ý  ')).toBe('Giá bán\n\nLưu ý')
    expect(cleanBullet('•   Khách hàng  ')).toBe('Khách hàng')
  })

  it('normalizes sections and calculates a transparent rule-based quality score', async () => {
    const document = await documentService.parseText('# Khám phá nhu cầu\n\nKhách hàng cần máy nhẹ để di chuyển và học tập tại cửa hàng.\n\n## Lưu ý\n\n- Không áp dụng ưu đãi khi chưa xác minh.\n- Trainer kiểm tra thông tin hiện hành.')
    expect(document.pages[0]!.sections).toHaveLength(2)
    expect(document.quality.rules).toHaveLength(5)
    expect(document.quality.score).toBeGreaterThan(0)
    expect(document.metadata.wordCount).toBeGreaterThan(10)
  })

  it('detects retail signals with deterministic heuristics', () => {
    expect(detectRetailSignals('Khách hàng hỏi giá và chương trình khuyến mãi')).toEqual(expect.arrayContaining(['scenario', 'price', 'campaign', 'promotion']))
    expect(detectRetailSignals('Lưu ý: Không áp dụng cho cấu hình này')).toEqual(expect.arrayContaining(['warning', 'campaign_rule', 'specification']))
  })

  it('recognizes PDF and reports metadata without pretending to parse', async () => {
    const pdf = await documentService.parseFile(file('%PDF /Type /Page /Type /Page', 'guide.pdf', 'application/pdf'))
    expect(pdf).toMatchObject({ status: 'parser_unavailable', metadata: { parserAvailable: false, pageCount: 2 } })
    expect(pdf.warnings[0]).toContain('parser chưa khả dụng')
  })

  it('recognizes PPTX slide metadata and DOCX placeholders safely', async () => {
    const pptx = await documentService.parseFile(file('ppt/slides/slide1.xml ppt/slides/slide3.xml', 'deck.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'))
    const docx = await documentService.parseFile(file('PK mock', 'guide.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
    expect(pptx.metadata.slideCount).toBe(3)
    expect(docx.status).toBe('parser_unavailable')
    expect(docx.pages[0]!.sections[0]!.elements[0]?.type).toBe('placeholder')
  })

  it('hands only normalized structure to AI and exports debuggable JSON', async () => {
    const raw = '# Tư vấn sản phẩm\n\nKhách hàng cần hiểu cấu hình và ngân sách trước khi chọn sản phẩm tại cửa hàng.'
    const document = await documentService.parseText(raw)
    const handoff = documentService.toAiHandoff(document)
    expect(handoff.normalizedText).toContain('Khách hàng')
    expect(handoff.sections[0]?.elements.length).toBeGreaterThan(0)
    expect(JSON.stringify(handoff)).not.toContain('rawText')
    expect(JSON.parse(documentService.exportNormalized(document))).toMatchObject({ schemaVersion: 1, status: 'parsed' })
  })
})
