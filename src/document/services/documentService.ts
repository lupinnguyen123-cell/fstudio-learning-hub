import type { DocumentElement, DocumentHandoff, DocumentSource, StructuredDocument } from '../types'
import { documentId } from '../utils/ids'
import { detectDocumentFormat } from '../utils/detectFormat'
import { DocumentParserFactory } from '../parsers/DocumentParserFactory'

export class DocumentService {
  private readonly factory: DocumentParserFactory
  constructor(factory = new DocumentParserFactory()) { this.factory = factory }
  async parseFile(file: File): Promise<StructuredDocument> {
    const format = detectDocumentFormat(file.name, file.type)
    if (!format) throw new Error('DOCUMENT_FORMAT_UNSUPPORTED')
    const source = this.source(file.name, file.type, file.size, format)
    const text = format === 'txt' || format === 'markdown' ? await file.text() : undefined
    const bytes = text === undefined ? new Uint8Array(await file.arrayBuffer()) : undefined
    const parser = this.factory.get(source); return parser.normalize(await parser.parse({ source, text, bytes }))
  }
  async parseText(text: string, fileName = 'trainer-source.md'): Promise<StructuredDocument> {
    const value = text.trim(); if (!value) throw new Error('DOCUMENT_SOURCE_EMPTY')
    const format = detectDocumentFormat(fileName, 'text/markdown') ?? 'markdown'; const source = this.source(fileName, 'text/markdown', new Blob([value]).size, format); const parser = this.factory.get(source); return parser.normalize(await parser.parse({ source, text: value }))
  }
  toAiHandoff(document: StructuredDocument): DocumentHandoff {
    return { schemaVersion: 1, sourceId: document.source.id, fileName: document.source.fileName, format: document.source.format, metadata: { title: document.metadata.title, pageCount: document.metadata.pageCount, slideCount: document.metadata.slideCount, wordCount: document.metadata.wordCount }, sections: document.pages.flatMap((page) => page.sections.map((section) => ({ id: section.id, title: section.title, level: section.level, elements: section.elements.filter((element) => element.type !== 'blank_line').map((element) => ({ id: element.id, type: element.type, content: elementContent(element), retailSignals: element.retailSignals })) }))), normalizedText: document.normalizedText, detectedSignals: document.detectedSignals, qualityScore: document.quality.score }
  }
  exportNormalized(document: StructuredDocument) { return JSON.stringify(document, null, 2) }
  private source(fileName: string, mimeType: string, size: number, format: DocumentSource['format']): DocumentSource { return { id: documentId('source'), fileName, mimeType, size, format, importedAt: new Date().toISOString() } }
}

function elementContent(element: DocumentElement): string { switch (element.type) { case 'heading': case 'paragraph': case 'quote': case 'subtitle': case 'speaker_note': case 'shape': return element.text; case 'list': return element.items.join('\n'); case 'image': return `${element.alt}\n${element.src}`.trim(); case 'table': return [element.headers, ...element.rows].map((row) => row.join(' | ')).join('\n'); case 'code': return element.code; case 'chart': return `${element.title}\n${element.description}`.trim(); case 'placeholder': return element.message; case 'blank_line': return '' } }
export const documentService = new DocumentService()
