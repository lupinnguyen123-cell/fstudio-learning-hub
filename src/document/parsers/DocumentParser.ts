import type { DocumentFormat, DocumentMetadata, DocumentParseInput, DocumentSource, ParsedDocument, StructuredDocument } from '../types'

export interface DocumentParser {
  readonly id: string
  readonly formats: readonly DocumentFormat[]
  supports(source: DocumentSource): boolean
  parse(input: DocumentParseInput): Promise<ParsedDocument>
  normalize(parsed: ParsedDocument): StructuredDocument
  metadata(input: DocumentParseInput): Promise<DocumentMetadata>
}
