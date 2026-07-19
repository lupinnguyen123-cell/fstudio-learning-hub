import { parseCourseDraft, parseJsonObject } from '../../../../src/ai/responseValidation'

type OpenAiResponse = { output_text?: unknown; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; model?: string; usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } }
export function outputText(value: unknown): { text: string; model?: string; usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } } {
  const response = value as OpenAiResponse
  const text = typeof response.output_text === 'string' ? response.output_text : response.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text
  if (!text) throw new Error('AI_INVALID_RESPONSE')
  return { text, model: response.model, usage: response.usage ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, totalTokens: response.usage.total_tokens } : undefined }
}
export const parseDraftResponse = (raw: string) => parseCourseDraft(parseJsonObject(raw))
export function parseRegenerateResponse(raw: string) { const value = parseJsonObject(raw); if (typeof value !== 'object' || value === null || !('after' in value) || typeof value.after !== 'string' || !value.after.trim()) throw new Error('AI_SCHEMA_VALIDATION_FAILED'); return value.after.trim() }
