import type { GenerateCourseRequest, RegenerateSectionRequest } from '../../../../src/ai/contracts'
import { ServerAiError } from './errorMapper'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const requestId = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value)
export function validateGenerateRequest(value: unknown, maxSourceChars: number): GenerateCourseRequest {
  if (!record(value) || !record(value.document) || !requestId(value.requestId)) throw new ServerAiError('AI_INVALID_RESPONSE', 400, 'Invalid request contract.')
  const document = value.document
  if (document.schemaVersion !== 1 || typeof document.sourceId !== 'string' || !Array.isArray(document.sections)) throw new ServerAiError('AI_UNSUPPORTED_SOURCE', 400, 'A normalized document is required.')
  if (typeof document.normalizedText !== 'string' || document.normalizedText.trim().length < 80) throw new ServerAiError('AI_SOURCE_TOO_SHORT', 400, 'Normalized document must contain at least 80 characters.')
  if (document.normalizedText.length > maxSourceChars) throw new ServerAiError('AI_SOURCE_TOO_LARGE', 413, 'Normalized document exceeds configured character limit.')
  if (!['product', 'sales', 'campaign'].includes(String(value.courseType)) || !['vi', 'en'].includes(String(value.language)) || typeof value.audience !== 'string' || typeof value.retailContext !== 'string') throw new ServerAiError('AI_INVALID_RESPONSE', 400, 'Invalid generation options.')
  return value as unknown as GenerateCourseRequest
}
export function validateRegenerateRequest(value: unknown, maxSourceChars: number): RegenerateSectionRequest {
  if (!record(value) || !requestId(value.requestId) || typeof value.action !== 'string' || !record(value.selection) || !record(value.parentContext) || typeof value.sourceExcerpt !== 'string' || typeof value.instruction !== 'string') throw new ServerAiError('AI_INVALID_RESPONSE', 400, 'Invalid regeneration request.')
  if (value.sourceExcerpt.length > maxSourceChars) throw new ServerAiError('AI_SOURCE_TOO_LARGE', 413, 'Source excerpt exceeds configured limit.')
  return value as unknown as RegenerateSectionRequest
}
