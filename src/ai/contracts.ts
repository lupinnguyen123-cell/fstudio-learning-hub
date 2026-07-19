import type { AiCourseDraft, AiPresetId, AiReviewSelection } from '../features/ai-authoring/types'
import type { RegenerateAction } from '../features/ai-authoring/aiReviewActions'
import type { DocumentHandoff } from '../document/types'

export type AiErrorCode = 'AI_NOT_CONFIGURED' | 'AI_UNAUTHORIZED' | 'AI_RATE_LIMITED' | 'AI_TIMEOUT' | 'AI_PROVIDER_ERROR' | 'AI_INVALID_RESPONSE' | 'AI_SCHEMA_VALIDATION_FAILED' | 'AI_SOURCE_TOO_SHORT' | 'AI_SOURCE_TOO_LARGE' | 'AI_UNSUPPORTED_SOURCE' | 'AI_NETWORK_ERROR'
export interface AiUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number }
export interface AiResponseMeta { provider: string; model: string; generatedAt: string; latencyMs: number; usage?: AiUsage; isMock?: boolean }

export interface GenerateCourseRequest {
  document: DocumentHandoff
  courseType: AiPresetId
  language: 'vi' | 'en'
  tone: 'professional_friendly'
  audience: string
  desiredModuleCount?: number
  desiredLessonLength?: 'short' | 'medium'
  includeQuiz: boolean
  includeScenario: boolean
  includeFlashcards: boolean
  retailContext: string
  requestId: string
}

export interface GenerateCourseResponse extends AiResponseMeta { requestId: string; draft: AiCourseDraft; warnings: string[] }
export interface RegenerateSectionRequest {
  requestId: string
  action: RegenerateAction
  selection: AiReviewSelection
  selectedItem: unknown
  parentContext: { courseTitle: string; moduleTitle?: string; lessonTitle?: string }
  sourceExcerpt: string
  instruction: string
  expectedResponseType: 'text'
}
export interface RegenerateSectionResponse extends AiResponseMeta { requestId: string; before: string; after: string; warnings: string[] }
export interface AiErrorPayload { error: { code: AiErrorCode; message: string; requestId?: string; retryable: boolean } }

export class AiClientError extends Error {
  readonly code: AiErrorCode
  readonly retryable: boolean
  constructor(code: AiErrorCode, message: string, retryable = false) { super(message); this.name = 'AiClientError'; this.code = code; this.retryable = retryable }
}
