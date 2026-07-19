import { createProvider, readProviderConfig } from './_shared/ai/providerFactory'
import { enforceRateLimit, errorResponse, json, logResult, parseBody, requirePost } from './_shared/ai/http'
import { validateGenerateRequest } from './_shared/ai/requestValidation'
import { AiCourseService } from '../../src/services/aiCourseService'

export default async (request: Request) => {
  let requestId: string | undefined
  try {
    requirePost(request); enforceRateLimit(request); const body = await parseBody(request); requestId = typeof body === 'object' && body !== null && 'requestId' in body ? String(body.requestId) : undefined; const maxChars = Number(process.env.AI_MAX_SOURCE_CHARS) || 30_000; const input = validateGenerateRequest(body, maxChars)
    try { const config = readProviderConfig(); const response = await createProvider(config).generateCourseDraft(input); logResult({ requestId, provider: response.provider, model: response.model, status: 'success', latencyMs: response.latencyMs, sourceLength: input.document.normalizedText.length, valid: true }); return json(response) }
    catch (error) {
      if (process.env.AI_ENABLE_MOCK_FALLBACK !== 'true' || process.env.CONTEXT === 'production') throw error
      const started = Date.now(); const service = new AiCourseService(null); const source = { id: input.document.sourceId, fileName: input.document.fileName, fileType: input.document.format, fileSize: input.document.normalizedText.length, extractedText: input.document.normalizedText, importedAt: new Date().toISOString(), sourceLanguage: input.language, metadata: { extractionMode: 'pasted' as const, note: 'Generated from normalized document in server development fallback.' } }; const generatedAt = new Date().toISOString(); const draft = service.generateCourseDraft(source, input.courseType); const response = { requestId: input.requestId, provider: 'mock', model: 'deterministic-local', draft: { ...draft, generation: { provider: 'mock', model: 'deterministic-local', generatedAt, latencyMs: Date.now() - started, isMock: true } }, warnings: ['Đây là kết quả mô phỏng, không phải AI provider thật.'], latencyMs: Date.now() - started, generatedAt, isMock: true }; logResult({ requestId, provider: 'mock', model: 'deterministic-local', status: 'mock_fallback', latencyMs: response.latencyMs, sourceLength: input.document.normalizedText.length, valid: true }); return json(response)
    }
  } catch (error) { return errorResponse(error, requestId) }
}
