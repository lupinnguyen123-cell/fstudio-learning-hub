import { safeError, ServerAiError } from './errorMapper'

const windows = new Map<string, { count: number; resetAt: number }>()
export const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
export function requirePost(request: Request) { if (request.method !== 'POST') throw new ServerAiError('AI_INVALID_RESPONSE', 405, 'Method not allowed.') }
export function enforceRateLimit(request: Request, limit = 12) { const ip = request.headers.get('x-nf-client-connection-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'; const now = Date.now(); const current = windows.get(ip); if (!current || current.resetAt <= now) { windows.set(ip, { count: 1, resetAt: now + 60_000 }); return } if (current.count >= limit) throw new ServerAiError('AI_RATE_LIMITED', 429, 'Too many AI requests.', true); current.count += 1 }
export async function parseBody(request: Request) { try { return await request.json() as unknown } catch { throw new ServerAiError('AI_INVALID_RESPONSE', 400, 'Request body must be valid JSON.') } }
export function logResult(fields: { requestId?: string; provider?: string; model?: string; status: string; latencyMs?: number; errorCode?: string; sourceLength?: number; valid?: boolean }) { console.info('ai_request', fields) }
export function errorResponse(error: unknown, requestId?: string) { const mapped = safeError(error, requestId); logResult({ requestId, status: 'error', errorCode: mapped.payload.error.code }); return json(mapped.payload, mapped.status) }
