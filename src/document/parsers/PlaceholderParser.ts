import type { DocumentFormat, DocumentParseInput, ParsedDocument } from '../types'
import { documentId } from '../utils/ids'
import { BaseDocumentParser } from './BaseDocumentParser'

export abstract class PlaceholderParser extends BaseDocumentParser {
  abstract readonly format: 'pdf' | 'pptx' | 'docx'
  get formats(): readonly DocumentFormat[] { return [this.format] }
  async metadata(input: DocumentParseInput) { const title = input.source.fileName.replace(/\.[^.]+$/, ''); const counts = this.counts(input.bytes); return { title, wordCount: 0, parserId: this.id, parserAvailable: false, ...counts } }
  async parse(input: DocumentParseInput): Promise<ParsedDocument> { const metadata = await this.metadata(input); const message = 'Định dạng đã nhận diện nhưng parser chưa khả dụng'; return { source: input.source, metadata, elements: [{ id: documentId('placeholder'), type: 'placeholder', format: this.format, message, retailSignals: [] }], rawText: '', status: 'parser_unavailable', warnings: [`${message}: ${this.format.toUpperCase()}.`] } }
  protected abstract counts(bytes?: Uint8Array): { pageCount?: number; slideCount?: number }
}

const ascii = (bytes?: Uint8Array) => bytes ? new TextDecoder('latin1').decode(bytes) : ''
export class PdfParser extends PlaceholderParser { readonly id = 'pdf-placeholder-v1'; readonly format = 'pdf' as const; protected counts(bytes?: Uint8Array) { const count = ascii(bytes).match(/\/Type\s*\/Page\b/g)?.length; return { pageCount: count || undefined } } }
export class PptxParser extends PlaceholderParser { readonly id = 'pptx-placeholder-v1'; readonly format = 'pptx' as const; protected counts(bytes?: Uint8Array) { const matches = [...ascii(bytes).matchAll(/ppt\/slides\/slide(\d+)\.xml/g)].map((item) => Number(item[1])); return { slideCount: matches.length ? Math.max(...matches) : undefined } } }
export class DocxParser extends PlaceholderParser { readonly id = 'docx-placeholder-v1'; readonly format = 'docx' as const; protected counts() { return {} } }
