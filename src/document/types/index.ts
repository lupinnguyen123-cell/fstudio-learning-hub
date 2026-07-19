export type DocumentFormat = 'txt' | 'markdown' | 'pdf' | 'pptx' | 'docx'
export type DocumentParseStatus = 'parsed' | 'parser_unavailable'
export type RetailSignal = 'product' | 'campaign' | 'campaign_rule' | 'scenario' | 'faq' | 'warning' | 'price' | 'promotion' | 'specification' | 'trainer_note'

export interface DocumentSource { id: string; fileName: string; mimeType: string; size: number; format: DocumentFormat; importedAt: string }
export interface DocumentMetadata { title: string; author?: string; pageCount?: number; slideCount?: number; wordCount: number; parserId: string; parserAvailable: boolean }
interface ElementBase { id: string; sourceLine?: number; retailSignals: RetailSignal[] }
export interface DocumentHeading extends ElementBase { type: 'heading'; text: string; level: 1 | 2 | 3 }
export interface DocumentParagraph extends ElementBase { type: 'paragraph'; text: string }
export interface DocumentList extends ElementBase { type: 'list'; ordered: boolean; items: string[] }
export interface DocumentImage extends ElementBase { type: 'image'; src: string; alt: string; title?: string }
export interface DocumentTable extends ElementBase { type: 'table'; headers: string[]; rows: string[][] }
export interface DocumentQuote extends ElementBase { type: 'quote'; text: string }
export interface DocumentCode extends ElementBase { type: 'code'; language?: string; code: string }
export interface DocumentSubtitle extends ElementBase { type: 'subtitle'; text: string }
export interface DocumentSpeakerNote extends ElementBase { type: 'speaker_note'; text: string }
export interface DocumentChart extends ElementBase { type: 'chart'; title: string; description: string }
export interface DocumentShape extends ElementBase { type: 'shape'; shapeKind: string; text: string }
export interface DocumentBlankLine extends ElementBase { type: 'blank_line' }
export interface DocumentPlaceholder extends ElementBase { type: 'placeholder'; format: 'pdf' | 'pptx' | 'docx'; message: string }
export type DocumentElement = DocumentHeading | DocumentParagraph | DocumentList | DocumentImage | DocumentTable | DocumentQuote | DocumentCode | DocumentSubtitle | DocumentSpeakerNote | DocumentChart | DocumentShape | DocumentBlankLine | DocumentPlaceholder
export interface DocumentSection { id: string; title: string; level: 0 | 1 | 2 | 3; elements: DocumentElement[]; retailSignals: RetailSignal[] }
export interface DocumentPage { id: string; number: number; sections: DocumentSection[] }
export interface DocumentQualityRule { id: string; label: string; passed: boolean }
export interface DocumentQuality { score: number; rules: DocumentQualityRule[] }
export interface StructuredDocument { schemaVersion: 1; source: DocumentSource; metadata: DocumentMetadata; status: DocumentParseStatus; pages: DocumentPage[]; normalizedText: string; detectedSignals: RetailSignal[]; quality: DocumentQuality; warnings: string[] }
export interface ParsedDocument { source: DocumentSource; metadata: DocumentMetadata; elements: DocumentElement[]; rawText: string; status: DocumentParseStatus; warnings: string[] }
export interface DocumentParseInput { source: DocumentSource; text?: string; bytes?: Uint8Array }
export interface DocumentHandoff { schemaVersion: 1; sourceId: string; fileName: string; format: DocumentFormat; metadata: Pick<DocumentMetadata, 'title' | 'pageCount' | 'slideCount' | 'wordCount'>; sections: Array<{ id: string; title: string; level: number; elements: Array<{ id: string; type: DocumentElement['type']; content: string; retailSignals: RetailSignal[] }> }>; normalizedText: string; detectedSignals: RetailSignal[]; qualityScore: number }
