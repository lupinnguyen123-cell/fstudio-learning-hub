import type { GenerateCourseRequest, GenerateCourseResponse, RegenerateSectionRequest, RegenerateSectionResponse } from '../../../../src/ai/contracts'

export interface AiProvider {
  generateCourseDraft(request: GenerateCourseRequest): Promise<GenerateCourseResponse>
  regenerateSection(request: RegenerateSectionRequest): Promise<RegenerateSectionResponse>
}

export interface AiProviderConfig { provider: 'openai'; apiKey: string; model: string; timeoutMs: number; maxSourceChars: number; enableMockFallback: boolean }
