import type { DocumentSource } from '../types'
import type { DocumentParser } from './DocumentParser'
import { MarkdownParser } from './MarkdownParser'
import { DocxParser, PdfParser, PptxParser } from './PlaceholderParser'
import { TxtParser } from './TxtParser'

export class DocumentParserFactory {
  private readonly parsers: readonly DocumentParser[]
  constructor(parsers: readonly DocumentParser[] = [new TxtParser(), new MarkdownParser(), new PdfParser(), new PptxParser(), new DocxParser()]) { this.parsers = parsers }
  get(source: DocumentSource): DocumentParser { const parser = this.parsers.find((candidate) => candidate.supports(source)); if (!parser) throw new Error('DOCUMENT_FORMAT_UNSUPPORTED'); return parser }
}
