import type { DocumentElement, DocumentParseInput, ParsedDocument } from '../types'
import { cleanLine } from '../utils/cleanText'
import { documentId } from '../utils/ids'
import { detectRetailSignals } from '../utils/retailHeuristics'
import { BaseDocumentParser } from './BaseDocumentParser'

export class MarkdownParser extends BaseDocumentParser {
  readonly id = 'markdown-parser-v1'
  readonly formats = ['markdown'] as const
  async metadata(input: DocumentParseInput) { const text = input.text ?? ''; const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || input.source.fileName.replace(/\.[^.]+$/, ''); return { title, wordCount: text.trim() ? text.trim().split(/\s+/).length : 0, parserId: this.id, parserAvailable: true } }
  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    const rawText = input.text ?? ''; const lines = rawText.replace(/\r\n?/g, '\n').split('\n'); const elements: DocumentElement[] = []; let index = 0
    while (index < lines.length) {
      const raw = lines[index] ?? ''; const line = cleanLine(raw)
      if (!line) { elements.push({ id: documentId('blank'), type: 'blank_line', sourceLine: index + 1, retailSignals: [] }); index += 1; continue }
      const fence = raw.match(/^```\s*([\w-]+)?/)
      if (fence) { const code: string[] = []; const start = index++; while (index < lines.length && !/^```/.test(lines[index] ?? '')) code.push(lines[index++] ?? ''); if (index < lines.length) index += 1; elements.push({ id: documentId('code'), type: 'code', language: fence[1], code: code.join('\n'), sourceLine: start + 1, retailSignals: [] }); continue }
      const heading = raw.match(/^(#{1,3})\s+(.+)$/)
      if (heading) { const text = cleanLine(heading[2] ?? ''); elements.push({ id: documentId('heading'), type: 'heading', text, level: heading[1]!.length as 1 | 2 | 3, sourceLine: index + 1, retailSignals: detectRetailSignals(text) }); index += 1; continue }
      const image = raw.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+["'](.+)["'])?\)$/)
      if (image) { elements.push({ id: documentId('image'), type: 'image', alt: cleanLine(image[1] ?? ''), src: image[2] ?? '', title: image[3], sourceLine: index + 1, retailSignals: detectRetailSignals(image[1] ?? '') }); index += 1; continue }
      if (/^>\s?/.test(raw)) { const quotes: string[] = []; const start = index; while (index < lines.length && /^>\s?/.test(lines[index] ?? '')) quotes.push(cleanLine((lines[index++] ?? '').replace(/^>\s?/, ''))); const text = quotes.join(' '); elements.push({ id: documentId('quote'), type: 'quote', text, sourceLine: start + 1, retailSignals: detectRetailSignals(text) }); continue }
      const table = parseTable(lines, index)
      if (table) { elements.push({ id: documentId('table'), type: 'table', headers: table.headers, rows: table.rows, sourceLine: index + 1, retailSignals: detectRetailSignals([...table.headers, ...table.rows.flat()].join(' ')) }); index = table.next; continue }
      const list = parseMarkdownList(lines, index)
      if (list) { elements.push({ id: documentId('list'), type: 'list', ordered: list.ordered, items: list.items, sourceLine: index + 1, retailSignals: detectRetailSignals(list.items.join(' ')) }); index = list.next; continue }
      const paragraphs = [line]; const start = index++
      while (index < lines.length && cleanLine(lines[index] ?? '') && !isMarkdownControl(lines, index)) paragraphs.push(cleanLine(lines[index++] ?? ''))
      const text = paragraphs.join(' '); elements.push({ id: documentId('paragraph'), type: 'paragraph', text, sourceLine: start + 1, retailSignals: detectRetailSignals(text) })
    }
    return { source: input.source, metadata: await this.metadata(input), elements, rawText, status: 'parsed', warnings: [] }
  }
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(cleanLine)
function parseTable(lines: string[], start: number): { headers: string[]; rows: string[][]; next: number } | null { const header = lines[start] ?? ''; const separator = lines[start + 1] ?? ''; if (!header.includes('|') || !/^\s*\|?\s*:?-{3,}/.test(separator)) return null; const headers = cells(header); const rows: string[][] = []; let index = start + 2; while (index < lines.length && (lines[index] ?? '').includes('|') && cleanLine(lines[index] ?? '')) rows.push(cells(lines[index++] ?? '')); return { headers, rows, next: index } }
function parseMarkdownList(lines: string[], start: number): { ordered: boolean; items: string[]; next: number } | null { const first = cleanLine(lines[start] ?? ''); const ordered = /^\d+[.)]\s+/.test(first); const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/; if (!pattern.test(first)) return null; const items: string[] = []; let index = start; while (index < lines.length && pattern.test(cleanLine(lines[index] ?? ''))) items.push(cleanLine(lines[index++] ?? '').replace(pattern, '')); return { ordered, items, next: index } }
function isMarkdownControl(lines: string[], index: number) { const line = lines[index] ?? ''; return /^(#{1,3})\s+|^```|^>\s?|^!\[|^[-*+]\s+|^\d+[.)]\s+/.test(line) || Boolean(parseTable(lines, index)) }
