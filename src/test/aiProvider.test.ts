import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { parseCourseDraft, parseJsonObject } from '../ai/responseValidation'
import { AiCourseService } from '../services/aiCourseService'
import { mapProviderStatus } from '../../netlify/functions/_shared/ai/errorMapper'
import { OpenAiProvider } from '../../netlify/functions/_shared/ai/openAiProvider'
import { createProvider, readProviderConfig } from '../../netlify/functions/_shared/ai/providerFactory'
import { parseRegenerateResponse } from '../../netlify/functions/_shared/ai/responseParser'
import { validateGenerateRequest } from '../../netlify/functions/_shared/ai/requestValidation'
import type { GenerateCourseRequest } from '../ai/contracts'

const service = new AiCourseService(null)
const source = service.analyzeSource({ name: 'source.md', size: 400, type: 'text/markdown' }, 'Nội dung đào tạo bán lẻ đủ dài để kiểm tra nhu cầu khách hàng, kiến thức sản phẩm và cách áp dụng tại cửa hàng F.Studio.').source
const draft = service.generateCourseDraft(source, 'product')
const document = { schemaVersion: 1 as const, sourceId: source.id, fileName: source.fileName, format: 'markdown' as const, metadata: { title: 'Source', wordCount: 24 }, sections: [{ title: 'Nội dung', level: 1, elements: [{ type: 'paragraph' as const, content: source.extractedText, retailSignals: ['product' as const] }] }], normalizedText: source.extractedText, detectedSignals: ['product' as const], qualityScore: 80 }
const request: GenerateCourseRequest = { document, courseType: 'product', language: 'vi', tone: 'professional_friendly', audience: 'Nhân viên', desiredLessonLength: 'short', includeQuiz: true, includeScenario: true, includeFlashcards: true, retailContext: 'F.Studio', requestId: 'request_12345678' }

describe('AI provider abstraction and validation', () => {
  it('selects OpenAI from server-only configuration', () => {
    const config = readProviderConfig({ AI_PROVIDER: 'openai', AI_API_KEY: 'test-secret', AI_MODEL: 'test-model' })
    expect(createProvider(config)).toBeInstanceOf(OpenAiProvider)
    expect(config.model).toBe('test-model')
  })

  it('returns AI_NOT_CONFIGURED without provider secrets', () => {
    expect(() => readProviderConfig({})).toThrowError(expect.objectContaining({ code: 'AI_NOT_CONFIGURED' }))
  })

  it('maps provider errors to safe codes', () => {
    expect(mapProviderStatus(401)).toMatchObject({ code: 'AI_UNAUTHORIZED', status: 503, retryable: false })
    expect(mapProviderStatus(429)).toMatchObject({ code: 'AI_RATE_LIMITED', status: 429, retryable: true })
    expect(mapProviderStatus(503)).toMatchObject({ code: 'AI_PROVIDER_ERROR', retryable: true })
  })

  it('rejects short, large and unsupported sources while accepting valid text', () => {
    expect(() => validateGenerateRequest({ ...request, document: { ...request.document, normalizedText: 'ngắn' } }, 1_000)).toThrowError(expect.objectContaining({ code: 'AI_SOURCE_TOO_SHORT' }))
    expect(() => validateGenerateRequest({ ...request, document: { ...request.document, normalizedText: 'a'.repeat(1_001) } }, 1_000)).toThrowError(expect.objectContaining({ code: 'AI_SOURCE_TOO_LARGE' }))
    expect(() => validateGenerateRequest({ ...request, document: { fileName: 'raw.pdf' } }, 1_000)).toThrowError(expect.objectContaining({ code: 'AI_UNSUPPORTED_SOURCE' }))
    expect(validateGenerateRequest(request, 1_000).requestId).toBe(request.requestId)
  })

  it('parses valid JSON and rejects malformed JSON or draft schema', () => {
    expect(parseCourseDraft(JSON.parse(JSON.stringify(draft))).title).toBe(draft.title)
    expect(() => parseJsonObject('{bad')).toThrow('AI_INVALID_RESPONSE')
    expect(() => parseCourseDraft({ ...draft, modules: [] })).toThrow('AI_SCHEMA_VALIDATION_FAILED')
    const unknown = structuredClone(draft) as unknown as { modules: Array<{ lessons: Array<{ blocks: Array<{ type: string }> }> }> }
    unknown.modules[0]!.lessons[0]!.blocks[0]!.type = 'unknown_block'
    expect(() => parseCourseDraft(unknown)).toThrow('AI_SCHEMA_VALIDATION_FAILED')
    expect(() => parseCourseDraft({ title: 'missing fields' })).toThrow('AI_SCHEMA_VALIDATION_FAILED')
  })

  it('generates a validated draft through the provider contract', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ model: 'test-model', output_text: JSON.stringify(draft), usage: { input_tokens: 12, output_tokens: 34, total_tokens: 46 } }), { status: 200 }))
    const provider = new OpenAiProvider({ provider: 'openai', apiKey: 'server-only', model: 'test-model', timeoutMs: 1_000, maxSourceChars: 30_000, enableMockFallback: false }, fetcher)
    const response = await provider.generateCourseDraft(request)
    expect(response.draft.title).toBe(draft.title)
    expect(response.draft.generation).toMatchObject({ provider: 'openai', model: 'test-model' })
    expect(response.draft.generation?.isMock).not.toBe(true)
    expect(response.usage?.totalTokens).toBe(46)
    expect(JSON.stringify(fetcher.mock.calls[0]?.[1])).not.toContain('VITE_')
  })

  it('regenerate response contains After and never applies by itself', () => {
    expect(parseRegenerateResponse('{"after":"Nội dung mới"}')).toBe('Nội dung mới')
    expect(() => parseRegenerateResponse('{"before":"Thiếu after"}')).toThrow('AI_SCHEMA_VALIDATION_FAILED')
  })

  it('keeps provider code and secret names out of frontend source', () => {
    const files = walk(join(process.cwd(), 'src')).filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes('/test/'))
    const frontend = files.map((file) => readFileSync(file, 'utf8')).join('\n')
    expect(frontend).not.toMatch(/Bearer\s+[A-Za-z0-9_-]{20,}/)
    expect(frontend).not.toMatch(/VITE_[A-Z_]*KEY/)
    expect(frontend).not.toContain("_shared/ai/openAiProvider")
  })
})

function walk(directory: string): string[] { return readdirSync(directory).flatMap((entry) => { const path = join(directory, entry); return statSync(path).isDirectory() ? walk(path) : [path] }) }
