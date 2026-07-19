import type { DocumentElement, DocumentQuality, DocumentSection, ParsedDocument, StructuredDocument } from '../types'
import { cleanLine, cleanText } from '../utils/cleanText'
import { documentId } from '../utils/ids'
import { detectRetailSignals } from '../utils/retailHeuristics'

export class DocumentNormalizer {
  normalize(parsed: ParsedDocument): StructuredDocument {
    const elements = parsed.elements.map(normalizeElement).filter((item): item is DocumentElement => item !== null)
    const sections = buildSections(elements)
    const normalizedText = cleanText(sections.flatMap((section) => [section.title, ...section.elements.map(elementText)]).filter(Boolean).join('\n\n'))
    const signals = [...new Set(sections.flatMap((section) => section.retailSignals))]
    const quality = calculateQuality(sections, normalizedText)
    return { schemaVersion: 1, source: parsed.source, metadata: { ...parsed.metadata, wordCount: normalizedText ? normalizedText.split(/\s+/).length : 0 }, status: parsed.status, pages: [{ id: documentId('page'), number: 1, sections }], normalizedText, detectedSignals: signals, quality, warnings: parsed.warnings }
  }
}

function normalizeElement(element: DocumentElement): DocumentElement | null {
  if (element.type === 'blank_line' || element.type === 'placeholder') return element
  if (element.type === 'table') { const headers = element.headers.map(cleanLine).filter(Boolean); const rows = element.rows.map((row) => row.map(cleanLine)).filter((row) => row.some(Boolean)); return headers.length || rows.length ? { ...element, headers, rows, retailSignals: detectRetailSignals([...headers, ...rows.flat()].join(' ')) } : null }
  if (element.type === 'list') { const items = element.items.map(cleanLine).filter(Boolean); return items.length ? { ...element, items, retailSignals: detectRetailSignals(items.join(' ')) } : null }
  if (element.type === 'image') return element.src.trim() ? { ...element, src: element.src.trim(), alt: cleanLine(element.alt), retailSignals: detectRetailSignals(element.alt) } : null
  if (element.type === 'code') return element.code.trim() ? { ...element, code: element.code.replace(/^\n+|\n+$/g, ''), retailSignals: [] } : null
  if (element.type === 'chart') { const title = cleanLine(element.title); const description = cleanLine(element.description); return title || description ? { ...element, title, description, retailSignals: detectRetailSignals(`${title} ${description}`) } : null }
  const text = cleanLine(element.text)
  if (!text) return null
  return { ...element, text, retailSignals: detectRetailSignals(text) }
}

function buildSections(elements: DocumentElement[]): DocumentSection[] {
  const sections: DocumentSection[] = []; let current: DocumentSection = { id: documentId('section'), title: 'Nội dung', level: 0, elements: [], retailSignals: [] }
  for (const element of elements) {
    if (element.type === 'heading') { if (current.elements.length || current.title !== 'Nội dung') sections.push(finalize(current)); current = { id: documentId('section'), title: element.text, level: element.level, elements: [], retailSignals: element.retailSignals } }
    else current.elements.push(element)
  }
  if (current.elements.length || !sections.length) sections.push(finalize(current))
  return sections
}
function finalize(section: DocumentSection): DocumentSection { return { ...section, retailSignals: [...new Set([...section.retailSignals, ...section.elements.flatMap((element) => element.retailSignals)])] } }
function elementText(element: DocumentElement): string { switch (element.type) { case 'heading': case 'paragraph': case 'quote': case 'subtitle': case 'speaker_note': case 'shape': return element.text; case 'list': return element.items.join('\n'); case 'image': return `${element.alt} ${element.src}`; case 'table': return [...element.headers, ...element.rows.flat()].join(' | '); case 'code': return element.code; case 'chart': return `${element.title} ${element.description}`; case 'placeholder': return element.message; case 'blank_line': return '' } }
function calculateQuality(sections: DocumentSection[], normalizedText: string): DocumentQuality { const content = sections.flatMap((section) => section.elements); const paragraphLengths = content.filter((item) => item.type === 'paragraph').map((item) => item.text.length); const rules = [{ id: 'content', label: 'Có nội dung hợp lệ', passed: normalizedText.length >= 80 }, { id: 'heading', label: 'Có heading', passed: sections.some((section) => section.level > 0) }, { id: 'section', label: 'Có cấu trúc section', passed: sections.length > 1 || sections.some((section) => section.title !== 'Nội dung') }, { id: 'density', label: 'Không có đoạn text quá dài', passed: paragraphLengths.every((length) => length <= 1_200) }, { id: 'elements', label: 'Có phần tử cấu trúc', passed: content.some((item) => ['list', 'table', 'quote', 'image'].includes(item.type)) }]; return { score: Math.round(rules.filter((rule) => rule.passed).length / rules.length * 100), rules } }
