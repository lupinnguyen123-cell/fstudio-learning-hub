import type { AiErrorCode, AiErrorPayload } from '../../../../src/ai/contracts'

export class ServerAiError extends Error {
  readonly code: AiErrorCode
  readonly status: number
  readonly retryable: boolean
  constructor(code: AiErrorCode, status: number, message: string, retryable = false) { super(message); this.name = 'ServerAiError'; this.code = code; this.status = status; this.retryable = retryable }
}

export function mapProviderStatus(status: number): ServerAiError {
  if (status === 401 || status === 403) return new ServerAiError('AI_UNAUTHORIZED', 503, 'AI provider authorization failed.')
  if (status === 429) return new ServerAiError('AI_RATE_LIMITED', 429, 'AI provider rate limit reached.', true)
  if (status >= 500) return new ServerAiError('AI_PROVIDER_ERROR', 503, 'AI provider is temporarily unavailable.', true)
  return new ServerAiError('AI_PROVIDER_ERROR', 502, 'AI provider rejected the request.')
}

export function safeError(error: unknown, requestId?: string): { status: number; payload: AiErrorPayload } {
  const mapped = error instanceof ServerAiError ? error : error instanceof Error && error.message === 'AI_INVALID_RESPONSE' ? new ServerAiError('AI_INVALID_RESPONSE', 502, 'AI returned unreadable data.') : error instanceof Error && error.message === 'AI_SCHEMA_VALIDATION_FAILED' ? new ServerAiError('AI_SCHEMA_VALIDATION_FAILED', 502, 'AI returned an invalid course structure.') : new ServerAiError('AI_PROVIDER_ERROR', 502, 'AI request failed.')
  return { status: mapped.status, payload: { error: { code: mapped.code, message: mapped.message, requestId, retryable: mapped.retryable } } }
}
