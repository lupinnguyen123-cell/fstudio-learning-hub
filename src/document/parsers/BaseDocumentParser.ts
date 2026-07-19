import { DocumentNormalizer } from '../normalizers/DocumentNormalizer'
import type { DocumentFormat, DocumentParseInput, DocumentSource, ParsedDocument } from '../types'
import type { DocumentParser } from './DocumentParser'

export abstract class BaseDocumentParser implements DocumentParser {
  abstract readonly id: string
  abstract readonly formats: readonly DocumentFormat[]
  supports(source: DocumentSource) { return this.formats.includes(source.format) }
  abstract parse(input: DocumentParseInput): Promise<ParsedDocument>
  abstract metadata(input: DocumentParseInput): Promise<ParsedDocument['metadata']>
  normalize(parsed: ParsedDocument) { return new DocumentNormalizer().normalize(parsed) }
}
