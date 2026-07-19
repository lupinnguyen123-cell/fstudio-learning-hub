import type { GenerateCourseRequest, GenerateCourseResponse, RegenerateSectionRequest, RegenerateSectionResponse } from '../../../../src/ai/contracts'
import { mapProviderStatus, ServerAiError } from './errorMapper'
import { generationPrompt, regenerationPrompt, systemInstruction } from './promptBuilder'
import type { AiProvider, AiProviderConfig } from './provider'
import { outputText, parseDraftResponse, parseRegenerateResponse } from './responseParser'
import { courseDraftSchema, regenerateSchema } from './schemas'

export class OpenAiProvider implements AiProvider {
  private readonly config: AiProviderConfig
  private readonly fetcher: typeof fetch
  constructor(config: AiProviderConfig, fetcher: typeof fetch = fetch) { this.config = config; this.fetcher = fetcher }

  async generateCourseDraft(request: GenerateCourseRequest): Promise<GenerateCourseResponse> {
    const started = Date.now(); const raw = await this.call(request.requestId, generationPrompt(request), 'ai_course_draft', courseDraftSchema); const parsed = outputText(raw); const draft = parseDraftResponse(parsed.text); const generatedAt = new Date().toISOString()
    return { requestId: request.requestId, provider: 'openai', model: parsed.model ?? this.config.model, draft: { ...draft, sourceDocumentId: request.document.sourceId, generation: { provider: 'openai', model: parsed.model ?? this.config.model, generatedAt, latencyMs: Date.now() - started, usage: parsed.usage } }, warnings: [], latencyMs: Date.now() - started, generatedAt, usage: parsed.usage }
  }

  async regenerateSection(request: RegenerateSectionRequest): Promise<RegenerateSectionResponse> {
    const started = Date.now(); const before = selectedText(request.selectedItem); const raw = await this.call(request.requestId, regenerationPrompt(request), 'ai_regenerate_section', regenerateSchema); const parsed = outputText(raw)
    return { requestId: request.requestId, provider: 'openai', model: parsed.model ?? this.config.model, before, after: parseRegenerateResponse(parsed.text), warnings: [], latencyMs: Date.now() - started, generatedAt: new Date().toISOString(), usage: parsed.usage }
  }

  private async call(requestId: string, userPrompt: string, schemaName: string, schema: object): Promise<unknown> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)
      try {
        const response = await this.fetcher('https://api.openai.com/v1/responses', { method: 'POST', headers: { authorization: `Bearer ${this.config.apiKey}`, 'content-type': 'application/json', 'x-client-request-id': requestId }, body: JSON.stringify({ model: this.config.model, store: false, input: [{ role: 'system', content: systemInstruction }, { role: 'user', content: userPrompt }], text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } } }), signal: controller.signal })
        if (!response.ok) { const mapped = mapProviderStatus(response.status); if (mapped.retryable && attempt === 0) continue; throw mapped }
        return await response.json() as unknown
      } catch (error) {
        if (error instanceof ServerAiError) throw error
        if (controller.signal.aborted) { if (attempt === 0) continue; throw new ServerAiError('AI_TIMEOUT', 504, 'AI request timed out.', true) }
        if (attempt === 0) continue
        throw new ServerAiError('AI_PROVIDER_ERROR', 503, 'AI provider network request failed.', true)
      } finally { clearTimeout(timer) }
    }
    throw new ServerAiError('AI_PROVIDER_ERROR', 503, 'AI provider request failed.', true)
  }
}

function selectedText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value !== 'object' || value === null) return ''
  const item = value as Record<string, unknown>
  for (const key of ['title', 'text', 'question', 'context', 'prompt', 'shortDescription']) if (typeof item[key] === 'string') return item[key]
  return JSON.stringify(value).slice(0, 4_000)
}
