import type { DocumentElement, DocumentParseInput, ParsedDocument } from '../types'
import { cleanBullet, cleanLine } from '../utils/cleanText'
import { documentId } from '../utils/ids'
import { detectRetailSignals } from '../utils/retailHeuristics'
import { BaseDocumentParser } from './BaseDocumentParser'

export class TxtParser extends BaseDocumentParser {
  readonly id = 'txt-parser-v1'
  readonly formats = ['txt'] as const
  async metadata(input: DocumentParseInput) { const text = input.text ?? ''; return { title: input.source.fileName.replace(/\.[^.]+$/, ''), wordCount: text.trim() ? text.trim().split(/\s+/).length : 0, parserId: this.id, parserAvailable: true } }
  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    const rawText = input.text ?? ''; const lines = rawText.replace(/\r\n?/g, '\n').split('\n'); const elements: DocumentElement[] = []; let index = 0; let firstContent = true
    while (index < lines.length) {
      const raw = lines[index] ?? ''; const line = cleanLine(raw)
      if (!line) { elements.push({ id: documentId('blank'), type: 'blank_line', sourceLine: index + 1, retailSignals: [] }); index += 1; continue }
      const list = parseList(lines, index)
      if (list) { elements.push({ id: documentId('list'), type: 'list', ordered: list.ordered, items: list.items, sourceLine: index + 1, retailSignals: detectRetailSignals(list.items.join(' ')) }); index = list.next; firstContent = false; continue }
      const heading = detectTxtHeading(line, firstContent, lines[index + 1] ?? '')
      if (heading) elements.push({ id: documentId('heading'), type: 'heading', text: line.replace(/:$/, ''), level: heading, sourceLine: index + 1, retailSignals: detectRetailSignals(line) })
      else elements.push({ id: documentId('paragraph'), type: 'paragraph', text: line, sourceLine: index + 1, retailSignals: detectRetailSignals(line) })
      firstContent = false; index += 1
    }
    return { source: input.source, metadata: await this.metadata(input), elements, rawText, status: 'parsed', warnings: [] }
  }
}

function parseList(lines: string[], start: number): { ordered: boolean; items: string[]; next: number } | null { const first = cleanLine(lines[start] ?? ''); const ordered = /^\d+[.)]\s+/.test(first); const bullet = /^[-*+•●▪◦‣–—]\s+/.test(first); if (!ordered && !bullet) return null; const items: string[] = []; let index = start; const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+•●▪◦‣–—]\s+/; while (index < lines.length && pattern.test(cleanLine(lines[index] ?? ''))) { items.push(cleanBullet(cleanLine(lines[index] ?? '').replace(/^\d+[.)]\s+/, ''))); index += 1 } return { ordered, items, next: index } }
function detectTxtHeading(line: string, first: boolean, nextRaw: string): 1 | 2 | 3 | null { if (line.length > 100) return null; if (first && !cleanLine(nextRaw)) return 1; if (/^[A-ZÀ-Ỹ0-9][A-ZÀ-Ỹ0-9\s:&/.-]{3,}$/.test(line)) return 2; if (line.endsWith(':') && line.split(/\s+/).length <= 10) return 3; return null }
